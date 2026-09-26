import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClashPointApp } from "./ClashPointApp";
import { analyzeTurn } from "@/lib/analyze";
import type { AnalyzeTurnRequest } from "@/lib/schemas";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("meeting lifecycle", () => {
  it("reports an unavailable optional live source without changing demo-source readiness", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ state: "unavailable", message: "GitHub source is not configured." }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ClashPointApp />);
    fireEvent.click(screen.getByRole("button", { name: /Start ClashPoint/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check optional live GitHub source" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Check optional live GitHub source" })).toHaveTextContent("OFFLINE"));
    expect(screen.getByText("DEMO SOURCES")).toBeVisible();
  });

  it.each(["Reset", "Pause", "Stop"])("discards an in-flight result after %s", async (action) => {
    let deliver!: (response: Response) => void;
    let payload!: AnalyzeTurnRequest;
    const fetchMock = vi.fn((_url: string, options: RequestInit) => {
      payload = JSON.parse(String(options.body));
      // Deliberately ignore AbortSignal to exercise the stale-response guard.
      return new Promise<Response>((resolve) => { deliver = resolve; });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClashPointApp />);
    fireEvent.click(screen.getByRole("button", { name: /manual/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start ClashPoint/ }));
    fireEvent.change(screen.getByLabelText("Transcript turn"), { target: { value: "Promise Feature X to Acme Friday." } });
    fireEvent.click(screen.getByRole("button", { name: /Submit turn/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: action }));
    if (action !== "Reset") {
      expect(screen.getByRole("button", { name: /Submit turn/ })).toBeDisabled();
      expect(screen.getByLabelText("Transcript turn")).toBeDisabled();
    }
    const result = await analyzeTurn(payload);
    await act(async () => { deliver(new Response(JSON.stringify(result))); });
    if (action === "Reset") fireEvent.click(screen.getByRole("button", { name: /Start ClashPoint/ }));
    else fireEvent.click(screen.getByRole("button", { name: /Resume/ }));
    expect(screen.queryByText("Commitment conflict")).not.toBeInTheDocument();
    expect(screen.queryByText(/temporarily unavailable/)).not.toBeInTheDocument();
  });

  it("rejects late microphone callbacks after stopping", async () => {
    let recognition!: FakeRecognition;
    class FakeRecognition {
      onresult?: (event: unknown) => void;
      onerror?: (event: unknown) => void;
      onstart?: () => void;
      onend?: () => void;
      constructor() { recognition = this; }
      start() { this.onstart?.(); }
      stop() {}
    }
    vi.stubGlobal("SpeechRecognition", FakeRecognition);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ClashPointApp />);
    fireEvent.click(screen.getByRole("button", { name: /microphone/i }));
    fireEvent.click(screen.getByRole("button", { name: /Start ClashPoint/ }));
    fireEvent.click(screen.getByRole("button", { name: /Listen as Maya/ }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    act(() => {
      recognition.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: "Promise Feature X Friday." }, isFinal: true }] });
      recognition.onerror?.({ error: "not-allowed" });
      recognition.onend?.();
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/STOPPED: capture/)).toBeVisible();
  });
});
