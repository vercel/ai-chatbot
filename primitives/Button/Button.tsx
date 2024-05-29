import clsx from "clsx";
import Link from "next/link";
import { ComponentProps, ReactNode, forwardRef } from "react";
import styles from "./Button.module.css";

interface Props {
  variant?: "primary" | "secondary" | "subtle" | "destructive";
  icon?: ReactNode;
  iconButton?: boolean;
}

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & Props
>(
  (
    { variant = "primary", icon, iconButton, children, className, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={clsx(
        className,
        styles.button,
        (iconButton || (icon && !children)) && styles.iconButton,
        {
          [styles.buttonPrimary]: variant === "primary",
          [styles.buttonSecondary]: variant === "secondary",
          [styles.buttonSubtle]: variant === "subtle",
          [styles.buttonDestructive]: variant === "destructive",
        }
      )}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
    </button>
  )
);

export function LinkButton({
  variant = "primary",
  icon,
  iconButton,
  children,
  className,
  ...props
}: ComponentProps<typeof Link> & Props) {
  return (
    <Link
      className={clsx(
        className,
        styles.button,
        (iconButton || (icon && !children)) && styles.iconButton,
        {
          [styles.buttonPrimary]: variant === "primary",
          [styles.buttonSecondary]: variant === "secondary",
          [styles.buttonSubtle]: variant === "subtle",
          [styles.buttonDestructive]: variant === "destructive",
        }
      )}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.label}>{children}</span>}
    </Link>
  );
}
