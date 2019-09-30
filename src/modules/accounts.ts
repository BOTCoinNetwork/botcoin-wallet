import * as path from 'path';

import { IBaseAccount, IReceipt } from 'evm-lite-client';
import { Account, Monet } from 'evm-lite-core';
import { toast } from 'react-toastify';

import Keystore, { IMonikerBaseAccount, IV3Keyfile } from 'evm-lite-keystore';
import utils, { Currency } from 'evm-lite-utils';

import { BaseAction, errorHandler, ThunkResult } from '.';
import { MonetDataDir, MonikerAccount, MonikerEVMAccount } from '../monet';

// Lists all accounts in keystore
const LIST_REQUEST = '@monet/accounts/LIST/REQUEST';
const LIST_SUCCESS = '@monet/accounts/LIST/SUCCESS';
const LIST_ERROR = '@monet/accounts/LIST/ERROR';

// Creates account in keystore
const CREATE_REQUEST = '@monet/accounts/CREATE/REQUEST';
const CREATE_SUCCESS = '@monet/accounts/CREATE/SUCCESS';
const CREATE_ERROR = '@monet/accounts/CREATE/ERROR';

// Get account balance and nonce from node
const GET_REQUEST = '@monet/accounts/GET/REQUEST';
const GET_SUCCESS = '@monet/accounts/GET/SUCCESS';
const GET_ERROR = '@monet/accounts/GET/ERROR';

// For decrypting an account
const UNLOCK_REQUEST = '@monet/accounts/UNLOCK/REQUEST';
const UNLOCK_SUCCESS = '@monet/accounts/UNLOCK/SUCCESS';
const UNLOCK_ERROR = '@monet/accounts/UNLOCK/ERROR';
const UNLOCK_RESET = '@monet/accounts/UNLOCK/RESET';

// For transferring tokens/coins from an account
const TRANSFER_REQUEST = '@monet/accounts/TRANSFER/REQUEST';
const TRANSFER_SUCCESS = '@monet/accounts/TRANSFER/SUCCESS';
const TRANSFER_ERROR = '@monet/accounts/TRANSFER/ERROR';

// Accounts state structure
export interface AccountsState {
	// Entire list of accounts
	readonly all: MonikerEVMAccount[];

	// Currently unlocked account
	readonly unlocked?: MonikerAccount;

	// A single error field to be used by this module for any action
	readonly error?: string;

	// Loading states for async actions
	readonly loading: {
		transfer: boolean;
		list: boolean;
		get: boolean;
		create: boolean;
		unlock: boolean;
	};
}

// Initial State of the accounts module
const initialState: AccountsState = {
	all: [],
	loading: {
		list: false,
		get: false,
		create: false,
		unlock: false,
		transfer: false
	}
};

// The root reducer for the accounts module
export default function reducer(
	state: AccountsState = initialState,
	action: BaseAction<any> = {} as BaseAction<any>
): Readonly<AccountsState> {
	switch (action.type) {
		// List accounts
		case LIST_REQUEST:
			return {
				...state,
				all: [],
				error: undefined,
				loading: {
					...state.loading,
					list: true
				}
			};
		case LIST_SUCCESS:
			return {
				...state,
				all: action.payload,
				loading: {
					...state.loading,
					list: false
				}
			};
		case LIST_ERROR:
			return {
				...state,
				all: [],
				error: action.payload,
				loading: {
					...state.loading,
					list: false
				}
			};

		// Create account
		case CREATE_REQUEST:
			return {
				...state,
				error: undefined,
				loading: {
					...state.loading,
					create: true
				}
			};
		case CREATE_SUCCESS:
			return {
				...state,
				error: undefined,
				all: [...state.all, action.payload],
				loading: {
					...state.loading,
					create: false
				}
			};
		case CREATE_ERROR:
			return {
				...state,
				error: action.payload,
				loading: {
					...state.loading,
					create: false
				}
			};

		// Get account
		case GET_REQUEST:
			return {
				...state,
				error: undefined,
				loading: {
					...state.loading,
					get: true
				}
			};
		case GET_SUCCESS:
			const accounts = state.all.map(acc => {
				const acc2 = {
					...acc
				};

				if (
					utils.cleanAddress(acc.address) ===
					utils.cleanAddress(action.payload.address)
				) {
					acc2.balance = action.payload.balance;
					acc2.nonce = action.payload.nonce;
				}

				return acc2;
			});

			return {
				...state,
				error: undefined,
				all: accounts,
				loading: {
					...state.loading,
					get: false
				}
			};
		case GET_ERROR:
			return {
				...state,
				error: action.payload,
				loading: {
					...state.loading,
					get: false
				}
			};

		// Unlock account
		case UNLOCK_REQUEST:
			return {
				...state,
				error: undefined,
				loading: {
					...state.loading,
					unlock: true
				}
			};
		case UNLOCK_SUCCESS:
			return {
				...state,
				unlocked: action.payload,
				error: undefined,
				loading: {
					...state.loading,
					unlock: false
				}
			};
		case UNLOCK_ERROR:
			return {
				...state,
				error: action.payload,
				loading: {
					...state.loading,
					unlock: false
				}
			};
		case UNLOCK_RESET:
			return {
				...state,
				error: undefined,
				unlocked: undefined,
				loading: {
					...state.loading,
					unlock: false
				}
			};

		// Transfer
		case TRANSFER_REQUEST:
			return {
				...state,
				loading: {
					...state.loading,
					transfer: true
				}
			};
		case TRANSFER_SUCCESS:
			return {
				...state,

				loading: {
					...state.loading,
					transfer: false
				}
			};
		case TRANSFER_ERROR:
			return {
				...state,
				loading: {
					...state.loading,
					transfer: false
				},
				error: action.payload
			};
		default:
			return state;
	}
}

/**
 * Should list all acounts from the keystore. It will update the redux state
 * and set the `all` attribute to the desired result.
 */
export function list(): ThunkResult<Promise<MonikerEVMAccount[]>> {
	return async (dispatch, getState) => {
		let accounts: MonikerEVMAccount[] = [];

		const { config } = getState();
		const error = errorHandler.bind(null, dispatch, LIST_ERROR);

		dispatch({
			type: LIST_REQUEST
		});

		let node: Monet | undefined = new Monet(
			config.data.connection.host,
			config.data.connection.port
		);

		await node.getInfo().catch(() => {
			node = undefined;
		});

		const datadir = new MonetDataDir(config.directory);
		const mk = await datadir
			.listKeyfiles()
			.catch(() => error('Could not load accounts'));

		accounts = Object.keys(mk).map(moniker => ({
			address: mk[moniker].address,
			balance: new Currency(0),
			nonce: 0,
			bytecode: '',
			moniker
		}));

		if (node) {
			accounts = await Promise.all(
				accounts.map(async account => {
					const acc = await node!
						.getAccount(account.address)
						.catch(console.log);

					return {
						...account,
						...acc,
						moniker: account.moniker
					};
				})
			);
		}

		dispatch({
			type: LIST_SUCCESS,
			payload: accounts
		});

		return accounts;
	};
}

export type IAccountsCreate = (
	moniker: string,
	password: string
) => Promise<IMonikerBaseAccount>;

/**
 * Creates an ethereum account and appends it into the list of all accounts.
 *
 * @param moniker - The moniker for the created account
 * @param password - The string to used to encrypt the newly created account
 */
export function create(
	moniker: string,
	password: string
): ThunkResult<Promise<MonikerEVMAccount>> {
	return async (dispatch, getState) => {
		const { config } = getState();

		const account: MonikerEVMAccount = {
			address: '',
			balance: new Currency(0),
			nonce: 0,
			bytecode: '',
			moniker
		};

		dispatch({
			type: CREATE_REQUEST
		});

		try {
			const keystore = new Keystore(
				path.join(config.directory, 'keystore')
			);

			const acc: IV3Keyfile = await keystore.create(moniker, password);

			account.address = acc.address;

			dispatch({
				type: CREATE_SUCCESS,
				payload: account
			});

			toast.success(
				`Account created: 0x${account.address.slice(0, 15)}...`
			);
		} catch (error) {
			dispatch({
				type: CREATE_ERROR,
				payload: error.toString()
			});
		}

		return account;
	};
}

/**
 * Should fetch `BaseAccount` type of the address prepopulating the object with
 * the address's balance and nonce.
 *
 * @param address - The address to fetch from the node
 */
export function get(address: string): ThunkResult<Promise<IBaseAccount>> {
	return async (dispatch, getState) => {
		const { config } = getState();
		let account = {} as IBaseAccount;

		dispatch({
			type: GET_REQUEST
		});

		try {
			if (!!Object.keys(config).length) {
				const node = new Monet(
					config.data.connection.host,
					config.data.connection.port
				);

				account = await node.getAccount(address);

				dispatch({
					type: GET_SUCCESS,
					payload: account
				});
			} else {
				throw Error('Configuration could not loaded.');
			}
		} catch (error) {
			dispatch({
				type: GET_ERROR,
				payload: error.toString()
			});
		}

		return account;
	};
}

/**
 * Should decrypt an account and set the result into the redux state. The account
 * will be removed after the session is closed or manually reset.
 *
 * @param moniker - The moniker of the account to unlock
 * @param password - The associated password for the address in question
 */
export function unlock(
	moniker: string,
	password: string
): ThunkResult<Promise<Account | undefined>> {
	return async (dispatch, getState) => {
		const { config } = getState();

		dispatch({
			type: UNLOCK_REQUEST
		});

		const keystore = new Keystore(path.join(config.directory, 'keystore'));
		const keyfile = await keystore.get(moniker);

		try {
			const account = Keystore.decrypt(
				keyfile,
				password.trim().replace(/(\r\n|\n|\r)/gm, '')
			);

			const monikerAccount = new MonikerAccount({
				address: account.address,
				privateKey: account.privateKey
			});

			monikerAccount.moniker = moniker;

			dispatch({
				type: UNLOCK_SUCCESS,
				payload: monikerAccount
			});

			return account;
		} catch (error) {
			dispatch({
				type: UNLOCK_ERROR,
				payload: error.toString()
			});

			toast.error('Invalid password.');

			return undefined;
		}
	};
}

/**
 * Reset function for unlocking an account.
 */
export function resetUnlock(): ThunkResult<void> {
	return dispatch => {
		dispatch({
			type: UNLOCK_RESET
		});
	};
}

/**
 * Should transfer the state amount of tokens/coins to the desired address.
 *
 * @param from - The `from` address of the transaction
 * @param to - The `to` address of the transaction
 * @param value - The amount of coin(s)/token(s) to send
 * @param gas - The maximum `gas` to use for this transaction
 * @param gasPrice - The price per `gas` to pay for the transaction
 */
export function transfer(
	to: string,
	value: number,
	gasPrice: number
): ThunkResult<Promise<IReceipt>> {
	return async (dispatch, getState) => {
		const state = getState();
		const config = state.config.data;
		const error = errorHandler.bind(null, dispatch, TRANSFER_ERROR);

		dispatch({
			type: TRANSFER_REQUEST
		});

		if (!state.accounts.unlocked) {
			throw Error('No account unlocked to sign the transaction');
		}

		if (!!Object.keys(config).length) {
			const node = new Monet(
				config.connection.host,
				config.connection.port
			);

			const info = await node.getInfo().catch(() => {
				error('No connection detected');
				return;
			});

			if (!info) {
				return {} as IReceipt;
			}

			const receipt = await node.transfer(
				state.accounts.unlocked,
				to,
				new Currency(value + 'T'),
				21000,
				gasPrice
			);

			dispatch({
				type: TRANSFER_SUCCESS,
				payload: receipt
			});

			dispatch(get(state.accounts.unlocked.address));

			toast.success('Transfer submitted');

			return receipt;
		} else {
			throw Error('Configuration could not loaded.');
		}
	};
}
