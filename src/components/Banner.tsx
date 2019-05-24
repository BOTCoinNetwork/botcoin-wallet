import * as React from 'react';

import styled from 'styled-components';

const colors = {
	purple: 'rgba(126, 66, 149, 1)',
	orange: '#f2711c',
	black: '#222'
};

interface Props {
	color: 'purple' | 'orange' | 'black';
}

class Banner extends React.Component<Props, any> {
	public render() {
		const { color } = this.props;

		const Banner = styled.div`
			background: ${colors[color]} !important;
			color: #fff !important;
			padding: 20px;
			box-shadow: 0 1px 1px rgba(0, 0, 0, 0.3) !important;
			position: relative;
			-webkit-box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3),
				0 0 40px rgba(0, 0, 0, 0.1) inset;
			-moz-box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3),
				0 0 40px rgba(0, 0, 0, 0.1) inset;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3),
				0 0 40px rgba(0, 0, 0, 0.1) inset;
		`;

		return <Banner>{this.props.children}</Banner>;
	}
}

export default Banner;
