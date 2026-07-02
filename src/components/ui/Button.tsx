import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    href?: string;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    href,
    className = "",
    ...props
}) => {
    const baseStyle =
        "inline-flex items-center justify-center px-8 py-3 rounded-[3px] text-sm tracking-[0.2em] uppercase font-medium transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

    const variants = {
        primary:
            "bg-primary text-white hover:bg-opacity-90 shadow-[0_4px_14px_0_rgba(20,42,68,0.2)] hover:shadow-[0_6px_20px_rgba(20,42,68,0.23)] hover:-translate-y-0.5",
        secondary:
            "bg-secondary text-white hover:bg-opacity-90 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        outline:
            "border border-primary text-primary hover:bg-primary hover:text-white",
    };

    const classes = `${baseStyle} ${variants[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};

export default Button;
