import { useEffect, useState } from 'react';
import { Dictionary, getDictionary, Locale } from '../../get-dictionary';

const useDictionary = (locale: Locale) => {
  const [dictionary, setDictionary] = useState<Dictionary>();

  useEffect(() => {
    getDictionary(locale).then((localeDictionary) => {
      setDictionary(localeDictionary);
    });
  }, []);

  return dictionary;
};

export default useDictionary;
