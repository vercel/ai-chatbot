import type { Meta, StoryObj } from "@storybook/react";
import { SiteInput } from "../components/dimensioning/SiteInput";

const meta: Meta<typeof SiteInput> = {
  title: "Dimensioning/SiteInput",
  component: SiteInput,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof SiteInput>;

export const OwnerMode: Story = {
  args: {
    persona: "owner",
    defaultValues: {
      roof: { total_area_m2: 100 },
      module: { preferred: "MOD_550" },
    },
  },
};

export const IntegratorMode: Story = {
  args: {
    persona: "integrator",
    defaultValues: {
      roof: {
        sections: [
          { id: "sec1", length_m: 10, width_m: 5, tilt_deg: 30, azimuth: 180 },
        ],
      },
      module: { preferred: "MOD_550" },
      inverter: { preferred: "INV_8K", target_dcac: 1.2 },
    },
  },
};