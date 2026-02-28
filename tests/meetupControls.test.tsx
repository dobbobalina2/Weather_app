import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MeetupControls } from "@/components/MeetupControls";

describe("MeetupControls", () => {
  it("validates and blocks short location values", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <MeetupControls
        config={{ location: "A", day: "fri", window: "afternoon" }}
        onApply={onApply}
      />
    );

    await user.click(screen.getByLabelText("Location"));
    await user.keyboard("{Enter}");

    expect(screen.getByText(/Please enter a real location/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it("submits valid config", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <MeetupControls
        config={{ location: "Austin, TX", day: "fri", window: "afternoon" }}
        onApply={onApply}
      />
    );

    await user.clear(screen.getByLabelText("Location"));
    await user.type(screen.getByLabelText("Location"), "Chicago, IL{Enter}");

    expect(onApply).toHaveBeenCalledWith({
      location: "Chicago, IL",
      day: "fri",
      window: "afternoon"
    });
  });
});
