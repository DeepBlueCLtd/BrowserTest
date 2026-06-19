/**
 * Quiz input factory.
 *
 * Builds the DOM input control for a question from the pure
 * {@link getQuestionInputSpec} spec: a `<select>` for MCQ questions, a text
 * `<input>` for numeric questions. Extracted from `quiz-table.ts`.
 */

import type { QuizQuestion, AnswerRecord } from '../types/contracts.js';
import { getQuestionInputSpec } from '../services/question-input.js';
import { createElement } from '../utils/dom-helpers.js';

/**
 * Create the input control for a question.
 *
 * @param question - Quiz question
 * @param existingAnswer - Existing answer if any (used to pre-fill)
 * @returns Input or select element
 */
export function createQuestionInput(
  question: QuizQuestion,
  existingAnswer?: AnswerRecord,
): HTMLInputElement | HTMLSelectElement {
  const spec = getQuestionInputSpec(question, existingAnswer);

  if (spec.type === 'select') {
    // Create select dropdown for MCQ
    const select = createElement('select');
    select.className = spec.className;

    // Add placeholder option
    const placeholderOption = createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = spec.placeholder;
    placeholderOption.disabled = true;
    select.appendChild(placeholderOption);

    // Add options from spec
    if (spec.options) {
      spec.options.forEach((opt) => {
        const option = createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
      });
    }

    // Set value from spec
    select.value = spec.value;

    return select;
  }

  // Create text input for numeric questions
  const input = createElement('input');
  input.type = spec.type;
  input.className = spec.className;
  input.placeholder = spec.placeholder;
  input.value = spec.value;

  return input;
}
