import clsx from "clsx";
import { ComponentProps, useMemo } from "react";
// import { GitHubIcon } from "@/icons";
import { LinkButton } from "@/primitives/Button";
import { Container } from "@/primitives/Container";
import styles from "./MarketingFooter.module.css";

export function MarketingFooter({
  className,
  ...props
}: ComponentProps<"footer">) {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className={clsx(className, styles.footer)} {...props}>
      <Container className={styles.container}>
        <span className={styles.copyright}>© {year} Liveblocks Inc.</span>
        {/* <LinkButton
          href="https://github.com/liveblocks/liveblocks/tree/main/starter-kits/nextjs-starter-kit"
          icon={<GitHubIcon />}
          target="_blank"
          variant="secondary"
        >
          View on GitHub
        </LinkButton> */}
      </Container>
    </footer>
  );
}
