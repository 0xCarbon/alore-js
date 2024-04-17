import React from 'react';
interface Props {
    onClick: () => void;
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
}
declare const BackButton: ({ onClick, disabled, children, className, ...props }: Props) => React.JSX.Element;
export default BackButton;
