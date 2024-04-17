/* eslint-disable react/no-danger */
'use client';
import { Button, Modal } from 'flowbite-react';
import React from 'react';
import useDictionary from '../hooks/useDictionary';
const TermsModal = ({ locale, show, onClose, onSubmit }) => {
    const dictionary = useDictionary(locale);
    const registerDictionary = dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.register;
    return (React.createElement(Modal, { show: show, onClose: onClose },
        React.createElement(Modal.Header, null,
            React.createElement("div", { className: 'px-8 pt-2' },
                React.createElement("span", { className: 'font-poppins text-[1.75rem] font-bold' }, registerDictionary === null || registerDictionary === void 0 ? void 0 : registerDictionary.termsTitle))),
        React.createElement(Modal.Body, { className: 'scrollbar' },
            React.createElement("div", { className: 'flex flex-col px-8 pb-5 pt-2' },
                React.createElement("span", { dangerouslySetInnerHTML: {
                        __html: (dictionary === null || dictionary === void 0 ? void 0 : dictionary.auth.register.termsDescription) || '',
                    }, className: 'mb-16' }),
                React.createElement(Button, { "data-test": 'accept-terms', onClick: onSubmit }, dictionary === null || dictionary === void 0 ? void 0 : dictionary.accept)))));
};
export default TermsModal;
