import { CSSProperties, FC, PropsWithChildren } from 'react';

interface IButton extends PropsWithChildren {
	style?: CSSProperties;
	onClick?: () => void;
}

const Button: FC<IButton> = ({ children, onClick }) => {
	return <button onClick={onClick}>{children}</button>;
};

export default Button;
