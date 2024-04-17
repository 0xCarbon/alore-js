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
import classNames from 'classnames';
import { Label, TextInput } from 'flowbite-react';
import React from 'react';
import { Controller, } from 'react-hook-form';
import InputErrorHelperText from './InputErrorHelperText';
const infoIcon = () => React.createElement("i", { className: 'fa-solid fa-circle-info text-alr-red' });
const InputForm = (_a) => {
    var { control, name, label, errors, type = 'text', 'data-test': dataTest, className } = _a, rest = __rest(_a, ["control", "name", "label", "errors", "type", 'data-test', "className"]);
    return (React.createElement(Controller, { control: control, name: name, render: ({ field }) => {
            var _a;
            return (React.createElement("div", { className: classNames('flex flex-col', className) },
                label && (React.createElement(Label, { className: 'mb-2 font-medium !text-gray-500', htmlFor: field.name }, label)),
                React.createElement(TextInput, Object.assign({}, field, rest, { type: type, color: errors[field.name] ? 'failure' : 'gray', rightIcon: errors[field.name] && infoIcon, "data-test": dataTest, helperText: errors[field.name] && (React.createElement(InputErrorHelperText, { id: dataTest, message: String((_a = errors === null || errors === void 0 ? void 0 : errors[field.name]) === null || _a === void 0 ? void 0 : _a.message) })) }))));
        } }));
};
export default InputForm;
