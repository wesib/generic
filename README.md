Wesib: Generic Components
=========================

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

[npm-image]: https://img.shields.io/npm/v/@wesib/generic.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@wesib/generic
[build-status-img]: https://github.com/wesib/generic/workflows/Build/badge.svg
[build-status-link]: https://github.com/wesib/generic/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/0fe115c6ca67457dbf8abfa5f2376ab4
[quality-link]: https://www.codacy.com/gh/wesib/generic/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wesib/generic&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/0fe115c6ca67457dbf8abfa5f2376ab4
[coverage-link]: https://www.codacy.com/gh/wesib/generic/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wesib/generic&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/wesib/generic
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://wesib.github.io/generic/ 


Component Shares
----------------

Shares allow enclosing component to share and update some data with nested ones.

To share something:

1. Create a `Share` class (or its subclass) instance.
   
   ```typescript
   import { Share } from '@wesib/generic';

   const MyShare = new Share<MyData>('my-share');
   ```

2. Amend enclosing component's property containing a data to share with `@Shared()` decorator:

   ```typescript
   import { Shared } from '@wesib/generic';
   import { Component } from '@wesib/wesib'; 
   
   @Component('my-container')
   class MyContainerComponent {
     
     @Shared(MyShare)
     mySharedData?: MyData;

     // Update the `mySharedData` property when the data is ready to be shared.   
   }
   ```

3. Consume the shared data in nested component.

   ```typescript
   import { AfterEvent } from '@proc7ts/fun-events';
   import { Component, ComponentContext } from '@wesib/wesib'; 
   
   @Component('my-nested')
   class MyNestedComponent {

     readonly myContainerData: AfterEvent<[MyShare?]>;
     
     constructor(context: ComponentContext) {
       this.myContainerData = MyShare.valueFor(context);
     }   
     
     // Consume shared data when it is reported by `myContainerData`.
   }
   ```

The sharing mechanism works despite sharer and consumer components instantiation order.


Buffered Fragment Rendering
---------------------------

Buffered rendering is useful when there is a lot of content to add to the page. This content may even contain nested
components.

For the sake of performance, it is reasonable to add such content to [DocumentFragment] first, initialize nested
components, and then add already rendered fragment to the document. E.g. using [requestAnimationFrame].

A `@RenderFragment()` amendment (and decorator) handle this:

```typescript
import { Attribute, Component } from '@wesib/wesib';
import { FragmentRendererExecution, RenderFragment } from '@wesib/generic';

@Component('my-list')
class MyList {

  /**
   * Declares `item-list` attribute.
   * 
   * Contains comma-separated `name=value` pairs.
   */  
  @Attribute()  
  itemList: string = '';

  /**
   * Renders item list.
   * 
   * This method will be called each time the `item-list` attribute updated.
   */
  @RenderFragment()
  render({ content }: FragmentRendererExecution) {
    // `content` is a `DocumentFragment` instance.
    // This method fills this `content` on each call.
    // The `content` will be added to the document at proper time.
    const ul = content.appendChild(document.createElement('ul'));  
    
    for (const item of this.itemList.split(',')) {
      
      const [name, value] = item.split(item, '=');  
      const li = ul.appendChild(document.createElement('li'));
      
      // Each `my-item` component will be settled after this method call, and _before_ it is added to the document.
      // If `my-item` renders its own content, this content will be added to this component's `content` fragment,
      // rather directly to document.
      const link = li.appendChild(document.createelement('my-item'));
   
      link.setAttribute('name', name);
      link.setAttribute('value', value);
    }   
  }

}
```

[DocumentFragment]: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
[requestAnimationFrame]: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame


HTTP Fetch
----------

An `HttpFetch` is a function available is bootstrap context. It resembles the [Fetch API], but returns an `OnEvent`
event sender, that sends a `Response` event(s), rather a promise resolving to the one. 

An `HttpFetchAgent` can be provided in bootstrap context to intercept HTTP requests. E.g. to modify the request and/or
response.

[Fetch API]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
