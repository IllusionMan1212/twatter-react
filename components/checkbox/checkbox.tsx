/* eslint-disable react/react-in-jsx-scope */
import React, { ForwardedRef, forwardRef, ReactElement, useState } from "react";
import styles from "./checkbox.module.scss";
import { CheckboxProps } from "src/types/props";

const defaultProps = {
    checked: false,
    label: "",
    disabled: false
};

// eslint-disable-next-line react/display-name
export const Checkbox = forwardRef((props: CheckboxProps, ref: ForwardedRef<HTMLInputElement>): ReactElement => {
    props = { ...defaultProps, ...props };

    const [checked, setChecked] = useState(props.checked);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChecked(!checked);
        props.handleChange(e);
    };

    return (
        <label className={`${styles.checkbox} ${props.disabled && styles.disabled}`} style={props.style}>
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                disabled={props.disabled}
                onChange={handleChange}
            />
            {props.label}
        </label>
    );
});
