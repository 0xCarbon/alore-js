var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Checkbox, Label } from 'flowbite-react';
import React from 'react';
import { Controller } from 'react-hook-form';
const CheckboxForm = (_a) => {
    var { className = '', control, name, label, 'data-test': dataTest } = _a, rest = __rest(_a, ["className", "control", "name", "label", 'data-test']);
    return (React.createElement(Controller, { control: control, name: name, render: ({ field }) => (React.createElement("div", { className: className },
            React.createElement("div", { className: 'mb-2 flex items-center gap-x-2' },
                React.createElement(Checkbox, Object.assign({}, field, rest, { value: String(field.value), checked: field.value, "data-test": dataTest })),
                React.createElement(Label, { className: 'text-sm font-normal text-gray-500', htmlFor: 'agreedWithTerms' }, label)))) }));
};
export default CheckboxForm;
