/* eslint-disable react/no-danger */

'use client';

import { Modal, Button } from 'flowbite-react';
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
          <Button
            data-test='accept-terms'
            className='group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white duration-300 bg-alr-red hover:bg-alr-dark-red border border-transparent focus:ring-red-300 disabled:hover:bg-red-900 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 dark:disabled:hover:bg-red-600 rounded-lg focus:ring-2 enabled:hover:bg-red-700 dark:enabled:hover:bg-red-700'
            onClick={onSubmit}
          >
            {dictionary?.accept}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TermsModal;
