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

  it("renders exact mirror geometry separately from copyable plain text", async () => {
    const user = userEvent.setup();
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);

    render(<ToolApp />);

    await user.click(screen.getByText("Exact mirror preview"));
    await user.type(screen.getByLabelText("Input"), "Room 204!");

    const preview = screen.getByTestId("visual-output");
    expect(preview).toHaveClass("mirror-visual");
    expect(preview).toHaveTextContent("Room 204!");
    expect(screen.queryByTestId("output-text")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download PNG" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy text" }));
    expect(clipboardSpy).toHaveBeenCalledWith("Room 204!");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Clipboard text cannot retain a geometric flip"
    );
  });
});
