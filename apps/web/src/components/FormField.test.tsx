import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FormField } from "./FormField.js";

function renderField(error?: string) {
  return render(
    <FormField id="email" label="Email" error={error}>
      <input id="email" type="email" />
    </FormField>,
  );
}

describe("FormField", () => {
  it("links the label to the control", () => {
    renderField();
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
  });

  it("renders a bold label", () => {
    renderField();
    expect(screen.getByText("Email")).toHaveClass("font-bold");
  });

  it("renders no error element when error is empty", () => {
    const { container } = renderField("");
    expect(container.querySelector("#email-error")).toBeNull();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("gives the error the id derived from the field id", () => {
    renderField("Enter a valid email address.");
    expect(screen.getByText("Enter a valid email address.")).toHaveAttribute("id", "email-error");
  });

  it("marks the error with a 4px solid danger left rule and bold small danger text", () => {
    renderField("Enter a valid email address.");
    expect(screen.getByText("Enter a valid email address.")).toHaveClass(
      "border-l-4",
      "border-solid",
      "border-danger",
      "text-sm",
      "font-bold",
      "text-danger",
    );
  });

  it("is not an alert", () => {
    renderField("Enter a valid email address.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
