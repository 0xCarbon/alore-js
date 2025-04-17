'use client';

import { Button, Modal, ModalBody, ModalHeader } from 'flowbite-react';
import React from 'react';

import { Locale } from '../get-dictionary';
import useDictionary from '../hooks/useDictionary';

interface Props {
  locale: Locale;
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const TermsModal = ({ locale, show, onClose, onSubmit }: Props) => {
  const dictionary = useDictionary(locale);
  const registerDictionary = dictionary?.auth.register;

  return (
    <Modal
      show={show}
      onClose={onClose}
    >
      <ModalHeader>
        <div className="px-8 pt-2">
          <span className="font-poppins text-[1.75rem] font-bold">
            {registerDictionary?.termsTitle}
          </span>
        </div>
      </ModalHeader>
      <ModalBody className="scrollbar">
        <div className="flex flex-col px-8 pb-5 pt-2">
          <span
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: dictionary?.auth.register.termsDescription || '',
            }}
            className="mb-16"
          />
          <Button
            data-testid="accept-terms"
            onClick={onSubmit}
          >
            {dictionary?.accept}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default TermsModal;
