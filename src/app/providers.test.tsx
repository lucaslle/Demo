import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Providers } from "./providers";

function QueryClientProbe() {
  const queryClient = useQueryClient();
  const { staleTime } = queryClient.getDefaultOptions().queries ?? {};

  return <p>staleTime : {String(staleTime)}</p>;
}

describe("Providers", () => {
  it("fournit un QueryClient avec un cache de 10 minutes", () => {
    render(
      <Providers>
        <QueryClientProbe />
      </Providers>,
    );

    expect(screen.getByText("staleTime : 600000")).toBeInTheDocument();
  });
});
