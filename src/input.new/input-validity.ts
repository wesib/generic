import { ComponentContext } from '@wesib/wesib';
import { AfterEvent, afterThe } from 'fun-events';
import { InValidation, inValidationResult } from 'input-aspects';
import { HierarchyContext } from '../hierarchy';
import { InputFromControl, InputFromNowhere } from './input-from-control';

/**
 * A validity of user input.
 *
 * This is an `AfterEvent` keeper of input validation result extracted from {@link InputFromControl input receiver}}
 * present in {@link HierarchyContext hierarchy context}.
 */
export type InputValidity = AfterEvent<[InValidation.Result]>;

/**
 * Obtains user input validity from input receiver present in component's hierarchy context.
 *
 * @param context  Component context to obtain input validity from.
 *
 * @returns Obtained input validity. The input is always valid when there is no input receiver.
 */
export function inputValidity(context: ComponentContext): InputValidity {
  return context.get(HierarchyContext).get(InputFromControl).keep.dig(
      (inputReceiver: InputFromControl | InputFromNowhere) =>
          inputReceiver.control?.aspect(InValidation) || afterThe(inValidationResult()),
  );
}
