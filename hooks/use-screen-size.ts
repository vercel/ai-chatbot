import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const LARGE_DESKTOP_BREAKPOINT = 1920;

export type ScreenSize = "mobile" | "laptop" | "large-desktop";

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<ScreenSize | undefined>(
    undefined
  );
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const updateScreenSize = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);

      if (currentWidth < MOBILE_BREAKPOINT) {
        setScreenSize("mobile");
      } else if (currentWidth >= LARGE_DESKTOP_BREAKPOINT) {
        setScreenSize("large-desktop");
      } else {
        setScreenSize("laptop");
      }
    };

    updateScreenSize();

    const mqlMobile = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );
    const mqlLarge = window.matchMedia(
      `(min-width: ${LARGE_DESKTOP_BREAKPOINT}px)`
    );

    const handleChange = () => {
      updateScreenSize();
    };

    mqlMobile.addEventListener("change", handleChange);
    mqlLarge.addEventListener("change", handleChange);

    window.addEventListener("resize", updateScreenSize);

    return () => {
      mqlMobile.removeEventListener("change", handleChange);
      mqlLarge.removeEventListener("change", handleChange);
      window.removeEventListener("resize", updateScreenSize);
    };
  }, []);

  const isMobile = screenSize === "mobile";
  const isLaptop = screenSize === "laptop";
  const isLargeDesktop = screenSize === "large-desktop";

  return {
    screenSize: screenSize ?? "mobile",
    width: width ?? 0,
    isMobile,
    isLaptop,
    isLargeDesktop,
  };
}

