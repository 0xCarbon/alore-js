import { useEffect, useState } from 'react';
import { getDictionary } from '../../get-dictionary';
const useDictionary = (locale) => {
    const [dictionary, setDictionary] = useState();
    useEffect(() => {
        getDictionary(locale).then((localeDictionary) => {
            setDictionary(localeDictionary);
        });
    }, []);
    return dictionary;
};
export default useDictionary;
