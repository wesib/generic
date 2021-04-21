import { nodeHost } from '@frontmeans/dom-primitives';
import { drekHost } from '@frontmeans/drek';
import { afterThe } from '@proc7ts/fun-events';
import { ComponentContext } from '@wesib/wesib';
import { Share } from './share';
import { ShareLocator, shareLocator } from './share-locator';
import { Share__symbol, ShareRef } from './share-ref';

describe('shares', () => {
  describe('ShareLocator', () => {

    let mockSharer: ComponentContext;
    let mockConsumer: ComponentContext;
    let mockShare: jest.Mocked<Share<string>>;
    let shareRef: ShareRef<string>;

    beforeEach(() => {
      mockSharer = { name: 'Mock sharer' } as any;
      mockConsumer = { name: 'Mock consumer' } as any;
      mockShare = { valueFor: jest.fn((_consumer, _options?) => afterThe('found', mockSharer)) } as
          Partial<jest.Mocked<Share<string>>> as
          jest.Mocked<Share<string>>;
      shareRef = { [Share__symbol]: mockShare };
    });

    describe('by share reference', () => {
      it('converts to function', async () => {

        const locator = shareLocator(shareRef);

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: undefined, local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = shareLocator(shareRef, { host: drekHost, local: 'too' });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: drekHost, local: 'too' });
      });
      it('respects explicit option', async () => {

        const locator = shareLocator(shareRef, { host: drekHost, local: true });

        expect(await locator(mockConsumer, { host: nodeHost, local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: nodeHost, local: false });
      });
    });

    describe('by mandatory spec', () => {
      it('converts to function', async () => {

        const locator = shareLocator({ share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = shareLocator({ share: shareRef }, { local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: true });
      });
      it('respects explicit option', async () => {

        const locator = shareLocator({ share: shareRef }, { local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: false });
      });
      it('prefers explicit spec', async () => {

        const locator = shareLocator({ share: shareRef, local: 'too' }, { local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { local: 'too' });
      });
    });

    describe('by spec', () => {
      it('converts to function', async () => {

        const locator = shareLocator({}, { share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: undefined, local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = shareLocator({}, { share: shareRef, host: drekHost, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: drekHost, local: true });
      });
      it('respects explicit option', async () => {

        const locator = shareLocator({}, { share: shareRef, host: drekHost, local: true });

        expect(await locator(mockConsumer, { host: nodeHost, local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: nodeHost, local: false });
      });
      it('prefers explicit spec', async () => {

        const locator = shareLocator(
            { host: nodeHost, local: 'too' },
            { share: shareRef, host: drekHost, local: true },
        );

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: nodeHost, local: 'too' });
      });
    });

    describe('by custom locator', () => {

      let custom: jest.Mock<
          ReturnType<ShareLocator.Custom<string>>,
          Parameters<ShareLocator.Custom<string>>>;

      beforeEach(() => {
        custom = jest.fn((_consumer, _options) => afterThe('found', mockSharer));
      });

      it('converts to function', async () => {

        const locator = shareLocator(custom);

        expect(await locator(mockConsumer)).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { host: nodeHost, local: false });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
      it('falls back to default option', async () => {

        const locator = shareLocator(custom, { host: drekHost, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { host: drekHost, local: true });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
      it('respects explicit option', async () => {

        const locator = shareLocator(custom, { host: drekHost, local: true });

        expect(await locator(mockConsumer, { local: false })).toBe('found');
        expect(custom).toHaveBeenLastCalledWith(mockConsumer, { host: drekHost, local: false });
        expect(mockShare.valueFor).not.toHaveBeenCalled();
      });
    });

    describe('by `null`', () => {
      it('converts to function', async () => {

        const locator = shareLocator(null, { share: shareRef });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: undefined, local: undefined });
      });
      it('falls back to default option', async () => {

        const locator = shareLocator(null, { share: shareRef, host: drekHost, local: true });

        expect(await locator(mockConsumer)).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: drekHost, local: true });
      });
      it('respects explicit option', async () => {

        const locator = shareLocator(null, { share: shareRef, host: nodeHost, local: true });

        expect(await locator(mockConsumer, { host: nodeHost, local: false })).toBe('found');
        expect(mockShare.valueFor).toHaveBeenLastCalledWith(mockConsumer, { host: nodeHost, local: false });
      });
    });
  });
});
