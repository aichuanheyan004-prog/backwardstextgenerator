import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToolApp } from "../src/ToolApp";

describe("ToolApp", () => {
  it("converts input live, switches mode, copies, swaps, and clears", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    render(<ToolApp />);

    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    const output = screen.getByLabelText("Output") as HTMLTextAreaElement;

    await user.type(input, "Hello 👋");
    expect(output.value).toBe("👋 olleH");
    expect(screen.getByRole("status")).toHaveTextContent("Output is ready");

    await user.click(screen.getByText("Reverse each word"));
    expect(output.value).toBe("olleH 👋");

    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(clipboardSpy).toHaveBeenCalledWith("olleH 👋");

    await user.click(screen.getByRole("button", { name: "Swap" }));
    expect(input.value).toBe("olleH 👋");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(input.value).toBe("");
    expect(output.value).toBe("");
  });

  it("supports manual conversion when live update is off", async () => {
    const user = userEvent.setup();

    render(<ToolApp defaultMode="reverse-word-order" />);

    const input = screen.getByLabelText("Input") as HTMLTextAreaElement;
    const output = screen.getByLabelText("Output") as HTMLTextAreaElement;

    await user.click(screen.getByLabelText("Live update"));
    await user.type(input, "One two three");
    expect(output.value).toBe("");

    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(output.value).toBe("three two One");
  });

  it("selects output if browser clipboard writing fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied")
    );

    render(<ToolApp />);

    await user.type(screen.getByLabelText("Input"), "abc");
    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Clipboard permission was unavailable"
    );
  });
});
