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
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import React from 'react';
const BackButton = (_a) => {
    var { onClick, disabled = false, children, className = '' } = _a, props = __rest(_a, ["onClick", "disabled", "children", "className"]);
    return (React.createElement("span", Object.assign({}, props, { onClick: !disabled ? onClick : undefined, className: classNames(className, `flex w-fit cursor-pointer items-center gap-x-1 text-base text-alr-red ${disabled ? 'cursor-not-allowed' : ''}`) }),
        React.createElement(ArrowLeftIcon, { className: 'h-4 w-4' }),
        children));
};
export default BackButton;
