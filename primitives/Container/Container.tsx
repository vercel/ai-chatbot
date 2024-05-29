import clsx from "clsx";
import { ComponentProps } from "react";
import styles from "./Container.module.css";

interface Props extends ComponentProps<"div"> {
  size?: "small" | "medium" | "large";
}

export function Container({
  size = "medium",
  className,
  children,
  ...props
}: Props) {
  return (
    <div
      className={clsx(className, styles.container, {
        [styles.containerSmall]: size === "small",
        [styles.containerMedium]: size === "medium",
        [styles.containerLarge]: size === "large",
      })}
      {...props}
    >
      {children}
    </div>
  );
}
