import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { YshSandpackPreview } from "./YshSandpackPreview";

describe("YshSandpackPreview", () => {
  it("renders without crashing", () => {
    render(<YshSandpackPreview />);
    expect(document.body).toBeInTheDocument();
  });
});
