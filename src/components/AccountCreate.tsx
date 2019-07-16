import * as React from 'react';

import styled from 'styled-components';

import { InjectedAlertProp, withAlert } from 'react-alert';
import { config, Transition } from 'react-spring/renderprops';
import { Button, Input } from 'semantic-ui-react';

import { AccountsState } from '../modules/accounts';

import Animation from './animations/Animation';

interface State {
	visible: boolean;
	fields: {
		password: string;
		verifyPassword: string;
	};
}

interface OwnProps {
	bottomOffset: number;
	create: any;
	accounts: AccountsState;
}

interface AlertProps {
	alert: InjectedAlertProp;
}

type Props = AlertProps & OwnProps;

class AccountCreate extends React.Component<Props, State> {
	public state = {
		visible: false,
		fields: {
			password: '',
			verifyPassword: ''
		}
	};

	public handleCreateAccount = () => {
		const { fields } = this.state;

		if (!fields.password || !fields.verifyPassword) {
			this.props.alert.error('Both fields must be filled in.');
			return;
		}

		if (fields.password !== fields.verifyPassword) {
			this.props.alert.error('Passwords do not match.');
			return;
		}

		this.setState({
			visible: false,
			fields: {
				password: '',
				verifyPassword: ''
			}
		});

		this.props.create(fields.password);
	};

	public render() {
		const { accounts, bottomOffset } = this.props;
		const { visible } = this.state;

		const Open = styled.div`
			position: fixed;
			bottom: ${bottomOffset}px;
			right: 0;
			width: auto;
			color: white !important;
			border-top-left-radius: 7px;
			border-bottom-left-radius: 7px;

			&:hover {
				cursor: pointer;
			}

			& button {
				border-top-right-radius: 0px !important;
				border-bottom-right-radius: 0px !important;
				margin: 0 !important;
				margin-left: -2px !important;
				box-shadow: 0 4px 20px -6px #000 !important;
			}
		`;

		const Close = styled.div`
			position: fixed;
			bottom: ${bottomOffset + 40}px;
			right: 0;
			width: auto;
			color: white !important;
			border-top-left-radius: 7px;
			border-bottom-left-radius: 7px;
			& button {
				border-top-right-radius: 0px !important;
				border-bottom-right-radius: 0px !important;
				margin: 0 !important;
				margin-left: -2px !important;
			}
			&:hover {
				cursor: pointer;
			}
		`;

		const Content = styled.div`
			position: fixed;
			bottom: ${bottomOffset}px;
			right: -341px;
			width: auto;
			background: #fff !important;
			box-shadow: 0 4px 20px -6px #999 !important;

			& h4 {
				background: rgba(0, 0, 0, 0.04);
				padding: 10px;
				letter-spacing: 0.5px;
				margin: 0 !important;
			}
			& div {
				padding: 5px 10px;
				padding-top: 0px;
			}
			& div.help {
				background: rgba(0, 0, 0, 0.02);
				padding: 4px 10px;
				color: #888;
				margin-bottom: 14px;
			}
		`;

		return (
			<React.Fragment>
				<Transition
					items={visible}
					from={{ right: '0px', display: 'none' }}
					enter={{ right: '340px', display: 'block' }}
					leave={{ right: '0px', display: 'none' }}
					config={config.stiff}
				>
					{show =>
						show &&
						(props => (
							<Open
								style={props}
								onClick={this.handleCreateAccount}
							>
								<Button
									icon="check"
									color="green"
									disabled={accounts.loading.create}
									loading={accounts.loading.create}
								/>
							</Open>
						))
					}
				</Transition>
				<Transition
					items={visible}
					from={{ opacity: 0, right: '0px' }}
					enter={{ opacity: 1, right: '340px' }}
					leave={{ opacity: 0, right: '0px' }}
					config={config.stiff}
				>
					{show =>
						show &&
						(props => (
							<Close
								style={props}
								onClick={() =>
									this.setState({
										visible: !visible
									})
								}
							>
								<Button
									icon="times"
									disabled={accounts.loading.create}
									loading={accounts.loading.create}
									color="red"
								/>
							</Close>
						))
					}
				</Transition>
				{!visible && (
					<Animation direction="right">
						<Open
							onClick={() =>
								this.setState({
									visible: true
								})
							}
						>
							<Button
								icon="plus"
								disabled={accounts.loading.create}
								loading={accounts.loading.create}
								color="green"
							/>
						</Open>
					</Animation>
				)}
				<Transition
					items={visible}
					from={{ right: '-340px' }}
					enter={{ right: '0px' }}
					leave={{ right: '-340px' }}
					config={config.stiff}
				>
					{show =>
						show &&
						(props => (
							<Content style={props}>
								<h4>Create An Account</h4>
								<div className="help">
									Enter a password to encrypt the created
									account.
								</div>
								<div>
									<Input
										placeholder="Set Password"
										type="password"
									/>
									<br />
									<Input
										placeholder="Verify Password"
										type="password"
									/>
								</div>
							</Content>
						))
					}
				</Transition>
			</React.Fragment>
		);
	}
}

export default withAlert<Props>(AccountCreate);
