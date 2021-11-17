import { CSSProperties, memo } from "react";

interface DateTimeProps {
    datetime: string;
    formattingFunction: (date: string) => string;
    className?: string;
    style?: CSSProperties;
}

const DateTime = memo((props: DateTimeProps) => {
    return (
        <div className={props.className} style={props.style}>
            {props.formattingFunction(props.datetime)}
        </div>
    );
});

export default DateTime;
