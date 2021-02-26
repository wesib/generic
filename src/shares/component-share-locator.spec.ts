import { afterThe } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { ComponentShare } from './component-share';
import { ComponentShareLocator, componentShareLocator } from './component-share-locator';
import { ComponentShare__symbol, ComponentShareRef } from './component-share-ref';

describe('shares', () => {
  describe('componentShareLocator', () => {

    let mockSharer: ComponentContext;
    let mockConsumer: ComponentContext;
    let mockShare: jest.Mocked<ComponentShare<string>>;
    let shareRef: ComponentShareRef<string>;

    beforeEach(() => {
      mockSharer = { name: 'Mock sharer' } as any;
      mockConsumer = { name: 'Mock consumer' } as any;
      mockShare = { valueFor: jest.fn((_consumer, _options?) => afterThe('found', mockSharer)) } as
          Partial<jest.Mocked<ComponentShare<string>>> as
          jest.Mocked<ComponentShare<string>>;
      shareRef = { [ComponentShare__symbol]: mockShare };
    });

    describe('by share reference', () => {
      it('converts to function', async () => {

        const locator = componentShareLocator(shareRef);

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = componentShareLocator(shareRef, { local: 'too' });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: 'too' });
      });
      it('respects explicit option', async () => {

        const locator = componentShareLocator(shareRef, { local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: false });
      });
    });

    describe('by mandatory spec', () => {
      it('converts to function', async () => {

        const locator = componentShareLocator({ share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = componentShareLocator({ share: shareRef }, { local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: true });
      });
      it('respects explicit option', async () => {

        const locator = componentShareLocator({ share: shareRef }, { local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: false });
      });
      it('prefers explicit spec', async () => {

        const locator = componentShareLocator({ share: shareRef, local: 'too' }, { local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: 'too' });
      });
    });

    describe('by spec', () => {
      it('converts to function', async () => {

        const locator = componentShareLocator({}, { share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = componentShareLocator({}, { share: shareRef, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: true });
      });
      it('respects explicit option', async () => {

        const locator = componentShareLocator({}, { share: shareRef, local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: false });
      });
      it('prefers explicit spec', async () => {

        const locator = componentShareLocator({ local: 'too' }, { share: shareRef, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: 'too' });
      });
    });

    describe('by custom locator', () => {

      let custom: jest.Mock<
          ReturnType<ComponentShareLocator.Custom<string>>,
          Parameters<ComponentShareLocator.Custom<string>>>;

      beforeEach(() => {
        custom = jest.fn((_consumer, _options) => afterThe('found', mockSharer));
      });

      it('converts to function', async () => {

        const locator = componentShareLocator(custom);

        expect(await locator(mockConsumer)).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { local: false });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
      it('falls back to default option', async () => {

        const locator = componentShareLocator(custom, { local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { local: true });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
      it('respects explicit option', async () => {

        const locator = componentShareLocator(custom, { local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { local: false });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
    });

    describe('by `null`', () => {
      it('converts to function', async () => {

        const locator = componentShareLocator(null, { share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = componentShareLocator(null, { share: shareRef, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: true });
      });
      it('respects explicit option', async () => {

        const locator = componentShareLocator(null, { share: shareRef, local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: false });
      });
    });
  });
});
