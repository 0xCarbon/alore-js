/* eslint-disable react/no-danger */

'use client';

import { Button, Modal } from 'flowbite-react';
import React from 'react';
import useDictionary from '../hooks/useDictionary';
import { Locale } from '../get-dictionary';

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
    <Modal show={show} onClose={onClose}>
      <Modal.Header>
        <div className='px-8 pt-2'>
          <span className='font-poppins text-[1.75rem] font-bold'>
            {registerDictionary?.termsTitle}
          </span>
        </div>
      </Modal.Header>
      <Modal.Body className='scrollbar'>
        <div className='flex flex-col px-8 pb-5 pt-2'>
          <span
            dangerouslySetInnerHTML={{
              __html: dictionary?.auth.register.termsDescription || '',
            }}
            className='mb-16'
          />
          <Button data-test='accept-terms' onClick={onSubmit}>
            {dictionary?.accept}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TermsModal;
