import classNames from 'classnames';
import React, { useMemo } from 'react';
const RE_DIGIT = /^\d+$/;
const OTPInput = ({ value, inputLength, 'data-test': dataTest = '', errorMessage, onChange, className, disabled = false, }) => {
    const inputs = useMemo(() => {
        const valueArray = value.split('');
        const items = [];
        for (let i = 0; i < inputLength; i += 1) {
            const char = valueArray[i];
            if (RE_DIGIT.test(char)) {
                items.push(char);
            }
            else {
                items.push('');
            }
        }
        return items;
    }, [value, inputLength]);
    function focusToNextInput(target) {
        const nextElementSibling = target.nextElementSibling;
        if (nextElementSibling) {
            nextElementSibling.focus();
        }
    }
    function focusToPrevInput(target) {
        const previousElementSibling = target.previousElementSibling;
        if (previousElementSibling) {
            previousElementSibling.focus();
        }
    }
    function inputOnChange(e, idx) {
        const { target } = e;
        let targetValue = target.value.trim();
        const isTargetValueDigit = RE_DIGIT.test(targetValue);
        if (!isTargetValueDigit && targetValue !== '') {
            return;
        }
        const nextInputEl = target.nextElementSibling;
        if (!isTargetValueDigit && nextInputEl && nextInputEl.value !== '') {
            return;
        }
        targetValue = isTargetValueDigit ? targetValue : ' ';
        const targetValueLength = targetValue.length;
        if (targetValueLength === 1) {
            const newValue = value.substring(0, idx) + targetValue + value.substring(idx + 1);
            onChange(newValue);
            if (!isTargetValueDigit) {
                return;
            }
            focusToNextInput(target);
        }
        else if (targetValueLength === inputLength) {
            onChange(targetValue);
            target.blur();
        }
    }
    function inputOnKeyDown(e) {
        const { key } = e;
        const target = e.target;
        if (key === 'ArrowRight' || key === 'ArrowDown') {
            e.preventDefault();
            return focusToNextInput(target);
        }
        if (key === 'ArrowLeft' || key === 'ArrowUp') {
            e.preventDefault();
            return focusToPrevInput(target);
        }
        const targetValue = target.value;
        target.setSelectionRange(0, targetValue.length);
        if (e.key !== 'Backspace' || targetValue !== '') {
            return;
        }
        focusToPrevInput(target);
    }
    function inputOnFocus(e) {
        const { target } = e;
        const prevInputEl = target.previousElementSibling;
        if (prevInputEl && prevInputEl.value === '') {
            return prevInputEl.focus();
        }
        target.setSelectionRange(0, target.value.length);
    }
    return (React.createElement("div", { "data-test": dataTest, className: classNames('flex flex-col items-center gap-y-6', className) },
        React.createElement("div", { className: 'flex w-full gap-x-5' }, inputs.map((digit, idx) => (React.createElement("input", { 
            // eslint-disable-next-line react/no-array-index-key
            key: idx, type: 'text', 
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus: idx === 0, inputMode: 'numeric', autoComplete: 'one-time-code', pattern: '\\d{1}', maxLength: inputLength, className: `h-[2.56rem] w-[2.56rem] rounded-md border ${errorMessage ? 'border-alr-red' : 'border-gray-300'} text-center font-semibold duration-500`, value: digit, onChange: (e) => inputOnChange(e, idx), onKeyDown: inputOnKeyDown, onFocus: inputOnFocus, disabled: disabled })))),
        errorMessage && (React.createElement("span", { className: 'text-base font-normal text-alr-red' }, errorMessage))));
};
export default OTPInput;
