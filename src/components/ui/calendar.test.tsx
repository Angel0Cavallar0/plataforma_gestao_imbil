import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/ui/calendar";

describe("Calendar", () => {
  it("monta e renderiza o grid do mês com os dias", () => {
    const { container, getAllByText } = render(
      <Calendar mode="single" defaultMonth={new Date(2026, 5, 15)} />,
    );
    // grid do react-day-picker
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
    // dia 15 presente no grid
    expect(getAllByText("15").length).toBeGreaterThan(0);
  });
});
