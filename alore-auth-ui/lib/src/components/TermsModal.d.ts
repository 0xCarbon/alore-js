import React from 'react';
import { Locale } from '../../get-dictionary';
interface Props {
    locale: Locale;
    show: boolean;
    onClose: () => void;
    onSubmit: () => void;
}
declare const TermsModal: ({ locale, show, onClose, onSubmit }: Props) => React.JSX.Element;
export default TermsModal;
