import React, { useEffect, useState } from 'react';

import { Currency } from 'evm-lite-utils';
import styled from 'styled-components';

import { faCheck, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Monet } from 'evm-lite-core';
import { useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import Avatar from '../components/Avatar';
import Header from '../components/Header';
import Loader from '../components/Loader';
import Transfer from '../components/Transfer';

import { MonikerEVMAccount } from 'src/monet';
import {
	selectAccounts,
	selectConfig,
	selectListAccountLoading
} from '../selectors';
import { capitalize, parseBalance } from '../utils';

const SStatistic = styled.div`
	/* background: #fff; */
	/* box-shadow: 2px 0px 40px rgba(0, 0, 0, 0.05); */
	width: 100%;
	border-bottom: var(--border);

	.col {
		padding: 20px 0;
		border-right: var(--border);
	}
`;

const SSettings = styled.div`
	padding: 30px !important;
	display: none;
`;

const STransfer = styled.div`
	padding: 30px !important;
	border-bottom: var(--border);
`;

type Props = {
	moniker: string;
};

const Account: React.FC<RouteComponentProps<Props>> = props => {
	const accounts = useSelector(selectAccounts);
	const config = useSelector(selectConfig);
	const loading = useSelector(selectListAccountLoading);

	const moniker = props.match.params.moniker;
	const [account, setAccount] = useState<MonikerEVMAccount>({
		moniker: '',
		balance: new Currency(0),
		nonce: 0,
		address: '',
		bytecode: ''
	});

	const fetchAccount = async (a: MonikerEVMAccount) => {
		const node = new Monet(config.connection.host, config.connection.port);
		const res = await node.getAccount(a.address);

		setAccount({
			...res,
			moniker: a.moniker
		});
	};

	useEffect(() => {
		const a = accounts.find(a => a.moniker.toLowerCase() === moniker);

		if (a) {
			setAccount(a);
			fetchAccount(a);
		} else {
			props.history.push('/');
		}
	}, []);

	return (
		<>
			<Header
				icon={<Avatar address={account.address} size={35} />}
				title={`${capitalize(account.moniker)}`}
			>
				<Loader loading={loading} />{' '}
				<Button disabled={loading} variant="primary">
					<FontAwesomeIcon icon={faCircleNotch} />
				</Button>
			</Header>
			<SStatistic className="">
				<Container>
					<Row className="align-items-center">
						<Col className="text-center">
							<h5>0 Seconds ago</h5>
							<div>Last Updated</div>
						</Col>
						<Col className="text-center">
							<h3>{parseBalance(account.balance)}</h3>
							<div>Balance</div>
						</Col>
						<Col className="text-center">
							<h3>{account.nonce}</h3>
							<div>Nonce</div>
						</Col>
						<Col className="text-center">
							<h3 className="green">
								<FontAwesomeIcon icon={faCheck} />
							</h3>
							<div>Validator</div>
						</Col>
					</Row>
				</Container>
			</SStatistic>

			<STransfer>
				<Transfer
					getAccount={() => fetchAccount(account)}
					account={account}
				/>
			</STransfer>
			<SSettings>
				<h5>Account Actions</h5>
				<li>Change Password</li>
				<li>Unlock</li>
			</SSettings>
		</>
	);
};

export default Account;
