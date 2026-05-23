Caching
Last updated May 19, 2026
This page covers caching with Cache Components, enabled by setting cacheComponents: true in your next.config.ts file. If you're not using Cache Components, see the Caching and Revalidating (Previous Model) guide.

Caching is a technique for storing the result of data fetching and other computations so that future requests for the same data can be served faster, without doing the work again.

Enabling Cache Components
You can enable Cache Components by adding the cacheComponents option to your Next config file:

next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheComponents: true,
}
 
export default nextConfig
Good to know: When Cache Components is enabled, GET Route Handlers follow the same prerendering model as pages. See Route Handlers with Cache Components for details.

Usage
The use cache directive caches the return value of async functions and components. You can apply it at two levels:

Data-level: Cache a function that fetches or computes data (e.g., getProducts(), getUser(id))
UI-level: Cache an entire component or page (e.g., async function BlogPosts())
Arguments and any closed-over values from parent scopes automatically become part of the cache key, which means different inputs will produce separate cache entries. This enables personalized or parameterized cached content. See serialization requirements and constraints for details on what can be cached and how arguments work.

Data-level caching
To cache an asynchronous function that fetches data, add the use cache directive at the top of the function body:

app/lib/data.ts
import { cacheLife } from 'next/cache'
 
export async function getUsers() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM users')
}
Data-level caching is useful when the same data is used across multiple components, or when you want to cache the data independently from the UI.

UI-level caching
To cache an entire component, page, or layout, add the use cache directive at the top of the component or page body:

app/page.tsx
import { cacheLife } from 'next/cache'
 
export default async function Page() {
  'use cache'
  cacheLife('hours')
 
  const users = await db.query('SELECT * FROM users')
 
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
If you add "use cache" at the top of a file, all exported functions in the file will be cached.

Streaming uncached data
For components that fetch data from an asynchronous source such as an API, a database, or any other async operation, and require fresh data on every request, do not use "use cache".

Instead, wrap the component in <Suspense> and provide a fallback UI. At request time, React renders the fallback first, then streams in the resolved content once the async work completes.

page.tsx
import { Suspense } from 'react'
 
async function LatestPosts() {
  const data = await fetch('https://api.example.com/posts')
  const posts = await data.json()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
 
export default function Page() {
  return (
    <>
      <h1>My Blog</h1>
      <Suspense fallback={<p>Loading posts...</p>}>
        <LatestPosts />
      </Suspense>
    </>
  )
}
The fallback (<p>Loading posts...</p>) is included in the static shell, while the component's content streams in at request time.

<Suspense> provides a fallback UI while async work completes, but it does not itself opt a component into dynamic rendering. If a component only performs synchronous work, it will complete during prerendering regardless of whether it is wrapped in <Suspense>.

Working with runtime APIs
Runtime APIs require information that is only available when a user makes a request. These include:

cookies - User's cookie data
headers - Request headers
searchParams - URL query parameters
params - Dynamic route parameters (unless at least one sample is provided via generateStaticParams).
Components that access runtime APIs should be wrapped in <Suspense>:

page.tsx
import { cookies } from 'next/headers'
import { Suspense } from 'react'
 
async function UserGreeting() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'light'
  return <p>Your theme: {theme}</p>
}
 
export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <UserGreeting />
      </Suspense>
    </>
  )
}
Passing runtime values to cached functions
You can extract values from runtime APIs and pass them as arguments to cached functions:

app/profile/page.tsx
import { cookies } from 'next/headers'
import { Suspense } from 'react'
 
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  )
}
 
// Component (not cached) reads runtime data
async function ProfileContent() {
  const session = (await cookies()).get('session')?.value
  return <CachedContent sessionId={session} />
}
 
// Cached component receives extracted value as a prop
async function CachedContent({ sessionId }: { sessionId: string }) {
  'use cache'
  // sessionId becomes part of the cache key
  const data = await fetchUserData(sessionId)
  return <div>{data}</div>
}
At request time, CachedContent executes if no matching cache entry is found, and stores the result for future requests with the same sessionId.

By default, use cache stores entries in-memory. In serverless environments where memory doesn't persist across requests, CachedContent may re-evaluate on every request. Consider 'use cache: remote' for durable, shared caching.

Working with non-deterministic operations
Operations like Math.random(), Date.now(), or crypto.randomUUID() produce different values each time they execute. Cache Components requires you to explicitly handle these.

To generate unique values per request, defer to request time by calling connection() before these operations, and wrap the component in <Suspense>:

page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
 
async function UniqueContent() {
  await connection()
  const uuid = crypto.randomUUID()
  return <p>Request ID: {uuid}</p>
}
 
export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UniqueContent />
    </Suspense>
  )
}
Alternatively, you can cache the result so all users see the same value until revalidation:

page.tsx
export default async function Page() {
  'use cache'
  const buildId = crypto.randomUUID()
  return <p>Build ID: {buildId}</p>
}
Working with deterministic operations
Operations like synchronous I/O, module imports, and pure computations can complete during prerendering. Components using only these operations have their rendered output automatically included in the static HTML shell.

page.tsx
import fs from 'node:fs'
 
export default async function Page() {
  const content = fs.readFileSync('./config.json', 'utf-8')
  const constants = await import('./constants.json')
  const processed = JSON.parse(content).items.map((item) => item.value * 2)
 
  return (
    <div>
      <h1>{constants.appName}</h1>
      <ul>
        {processed.map((value, i) => (
          <li key={i}>{value}</li>
        ))}
      </ul>
    </div>
  )
}
Good to know: This includes queries to embedded databases with synchronous APIs, such as better-sqlite3 or Node.js's built-in node:sqlite. If you need per-request data from a synchronous source, call connection() before the query.

How rendering works
At build time, Next.js renders your route's component tree. How each component is handled depends on the APIs it uses:

use cache: the result is cached and included in the static shell
<Suspense>: fallback UI is included in the static shell while the content streams at request time
Deterministic operations: like pure computations and module imports are automatically included in the static shell
This generates a static shell consisting of HTML for initial page loads and a serialized RSC Payload for client-side navigation, ensuring the browser receives fully rendered content instantly whether users navigate directly to the URL or transition from another page.

Partially re-rendered Product Page showing static nav and product information, and dynamic cart and recommended products
This rendering approach is called Partial Prerendering (PPR), and it's the default behavior with Cache Components.

You can verify that a route was fully prerendered by checking the build output summary. Alternatively, see what content was added to the static shell of any page by viewing the page source in your browser.

Diagram showing partially rendered page on the client, with loading UI for chunks that are being streamed.
Next.js requires you to explicitly handle components that can't complete during prerendering. If they aren't wrapped in <Suspense> or marked with use cache, you'll see an Uncached data was accessed outside of <Suspense> error during development and build time.

🎥 Watch: Why Partial Prerendering and how it works → YouTube (10 minutes).

Opting out of the static shell
Placing a <Suspense> boundary with an empty fallback above the document body in your Root Layout causes the entire app to defer to request time. Because the fallback is empty, there is no static shell to send immediately, so every request blocks until the page is fully rendered. To limit this to specific routes, use multiple root layouts.

app/layout.tsx
import { Suspense } from 'react'
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <Suspense fallback={null}>
        <body>{children}</body>
      </Suspense>
    </html>
  )
}
Good to know: This same pattern applies when generateViewport accesses uncached dynamic data. See Viewport with Cache Components for a detailed example.

Putting it all together
Here's a complete example showing static content, cached dynamic content, and streaming dynamic content working together on a single page:

app/blog/page.tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag, updateTag } from 'next/cache'
import Link from 'next/link'
 
export default function BlogPage() {
  return (
    <>
      {/* Static content - prerendered automatically */}
      <header>
        <h1>Our Blog</h1>
        <nav>
          <Link href="/">Home</Link> | <Link href="/about">About</Link>
        </nav>
      </header>
 
      {/* Cached dynamic content - included in the static shell */}
      <BlogPosts />
 
      {/* Runtime dynamic content - streams at request time */}
      <Suspense fallback={<p>Loading your preferences...</p>}>
        <UserPreferences />
      </Suspense>
 
      {/* Mutation - server action that revalidates the cache */}
      <Suspense fallback={<p>Loading...</p>}>
        <CreatePost />
      </Suspense>
    </>
  )
}
 
// Everyone sees the same blog posts (revalidated every hour)
async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')
 
  const res = await fetch('https://api.vercel.app/blog')
  const posts = await res.json()
 
  return (
    <section>
      <h2>Latest Posts</h2>
      <ul>
        {posts.slice(0, 5).map((post: any) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>
              By {post.author} on {post.date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
 
// Personalized per user based on their cookie
async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value || 'light'
  const favoriteCategory = (await cookies()).get('category')?.value
 
  return (
    <aside>
      <p>Your theme: {theme}</p>
      {favoriteCategory && <p>Favorite category: {favoriteCategory}</p>}
    </aside>
  )
}
 
// Admin-only form that creates a post and revalidates the cache
async function CreatePost() {
  const isAdmin = (await cookies()).get('role')?.value === 'admin'
  if (!isAdmin) return null
 
  async function createPost(formData: FormData) {
    'use server'
    await db.post.create({ data: { title: formData.get('title') } })
    updateTag('posts')
  }
 
  return (
    <form action={createPost}>
      <input name="title" placeholder="Post title" required />
      <button type="submit">Publish</button>
    </form>
  )
}
During prerendering, the header (static) and blog posts (cached with use cache) become part of the static shell along with the fallback UI for user preferences. Only the personalized preferences stream in at request time. When an admin publishes a new post, the updateTag call immediately expires the blog posts cache so the next visitor sees it.

Good to know: generateMetadata and generateViewport track runtime data access separately from the page. See Metadata with Cache Components and Viewport with Cache Components for how to handle this.



====================================================

Revalidating
Last updated May 19, 2026
This page covers revalidation with Cache Components, enabled by setting cacheComponents: true in your next.config.ts file. If you're not using Cache Components, see the Caching and Revalidating (Previous Model) guide.

Revalidation is the process of updating cached data. It lets you keep serving fast, cached responses while ensuring content stays fresh. There are two strategies:

Time-based revalidation: Automatically refresh cached data after a set duration using cacheLife.
On-demand revalidation: Manually invalidate cached data after a mutation using revalidateTag, updateTag, or revalidatePath.
cacheLife
cacheLife controls how long cached data remains valid. Use it inside a use cache scope to set the cache lifetime.

app/lib/data.ts
import { cacheLife } from 'next/cache'
 
export async function getProducts() {
  'use cache'
  cacheLife('hours')
  return db.query('SELECT * FROM products')
}
cacheLife accepts a profile name or a custom configuration object:

Profile	stale	revalidate	expire
seconds	0	1s	60s
minutes	5m	1m	1h
hours	5m	1h	1d
days	5m	1d	1w
weeks	5m	1w	30d
max	5m	30d	~indefinite
For fine-grained control, pass an object:

'use cache'
cacheLife({
  stale: 3600, // 1 hour until considered stale
  revalidate: 7200, // 2 hours until revalidated
  expire: 86400, // 1 day until expired
})
Good to know: A cache is considered "short-lived" when it uses the seconds profile, revalidate: 0, or expire under 5 minutes. Short-lived caches are automatically excluded from prerenders and become dynamic holes instead. See Prerendering behavior for details.

See the cacheLife API reference for all profiles and custom configuration options.

cacheTag
cacheTag lets you tag cached data so it can be invalidated on-demand. Use it inside a use cache scope:

app/lib/data.ts
TypeScript

TypeScript
import { cacheTag } from 'next/cache'
 
export async function getProducts() {
  'use cache'
  cacheTag('products')
  return db.query('SELECT * FROM products')
}
Once tagged, invalidate the cache using revalidateTag or updateTag.

See the cacheTag API reference to learn more.

revalidateTag
revalidateTag invalidates cache entries by tag using stale-while-revalidate semantics — stale content is served immediately while fresh content loads in the background. This is ideal for content where a slight delay in updates is acceptable, like blog posts or product catalogs.

app/lib/actions.ts
TypeScript

TypeScript
import { revalidateTag } from 'next/cache'
 
export async function updateUser(id: string) {
  // Mutate data
  revalidateTag('user', 'max') // Recommended: stale-while-revalidate
}
You can reuse the same tag in multiple functions to revalidate them all at once. Call revalidateTag in a Server Action or Route Handler.

Good to know: The second argument sets how long stale content can be served while fresh content generates in the background. Once it expires, subsequent requests block until fresh content is ready. Using 'max' gives the longest stale window.

See the revalidateTag API reference to learn more.

updateTag
updateTag immediately expires cached data for read-your-own-writes scenarios — the user sees their change right away instead of stale content. Unlike revalidateTag, it can only be used in Server Actions.

app/lib/actions.ts
TypeScript

TypeScript
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
 
export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get('title'),
      content: formData.get('content'),
    },
  })
 
  updateTag('posts')
  redirect(`/posts/${post.id}`)
}
updateTag	revalidateTag
Where	Server Actions only	Server Actions and Route Handlers
Behavior	Immediately expires cache	Stale-while-revalidate
Use case	Read-your-own-writes (user sees their change)	Background refresh (slight delay OK)
See the updateTag API reference to learn more.

revalidatePath
revalidatePath invalidates all cached data for a specific route path. Use it when you want to revalidate a route without knowing which tags are associated with it.

app/lib/actions.ts
TypeScript

TypeScript
import { revalidatePath } from 'next/cache'
 
export async function updateUser(id: string) {
  // Mutate data
  revalidatePath('/profile')
}
Good to know: Prefer tag-based revalidation (revalidateTag/updateTag) over path-based when possible — it's more precise and avoids over-invalidating.

See the revalidatePath API reference to learn more.

What should I cache?
Cache data that doesn't depend on runtime data and that you're OK serving from cache for a period of time. Use use cache with cacheLife to describe that behavior.

For content management systems with update mechanisms, use tags with longer cache durations and rely on revalidateTag to refresh content when it actually changes, rather than expiring the cache preemptively.

Good to know: In serverless environments, in-memory cache entries may not persist across revalidations. See runtime caching considerations for details.


=====================================


cacheTag
Last updated May 19, 2026
The cacheTag function allows you to tag cached data for on-demand invalidation. By associating tags with cache entries, you can selectively purge or revalidate specific cache entries without affecting other cached data.

Usage
To use cacheTag, enable the cacheComponents flag in your next.config.js file:

next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheComponents: true,
}
 
export default nextConfig
The cacheTag function takes one or more string values.

app/data.ts
TypeScript

TypeScript
import { cacheTag } from 'next/cache'
 
export async function getData() {
  'use cache'
  cacheTag('my-data')
  const data = await fetch('/api/data')
  return data
}
You can then purge the cache on-demand from a Server Function or Route Handler:

Use updateTag inside a Server Function for read-your-own-writes scenarios, where a user makes a change and the next read should fetch fresh data immediately.
Use revalidateTag when it is acceptable to serve stale data while revalidation happens in the background, or when revalidating from a route handler.
The example below uses revalidateTag:

app/action.ts
TypeScript

TypeScript
'use server'
 
import { revalidateTag } from 'next/cache'
 
export default async function submit() {
  await addPost()
  revalidateTag('my-data')
}
Good to know
Idempotent Tags: Applying the same tag multiple times has no additional effect.
Multiple Tags: You can assign multiple tags to a single cache entry by passing multiple string values to cacheTag.
cacheTag('tag-one', 'tag-two')
Limits: A single cacheTag() call accepts up to 128 tags, each with a maximum length of 256 characters. Tags longer than 256 characters are skipped, and any tags past the 128th in one call are dropped. Both cases log a console warning.
Examples
Tagging components or functions
Tag your cached data by calling cacheTag within a cached function or component:

app/components/bookings.tsx
TypeScript

TypeScript
import { cacheTag } from 'next/cache'
 
interface BookingsProps {
  type: string
}
 
export async function Bookings({ type = 'haircut' }: BookingsProps) {
  'use cache'
  cacheTag('bookings-data')
 
  async function getBookingsData() {
    const data = await fetch(`/api/bookings?type=${encodeURIComponent(type)}`)
    return data
  }
 
  return //...
}
Creating tags from external data
You can use the data returned from an async function to tag the cache entry.

app/components/bookings.tsx
TypeScript

TypeScript
import { cacheTag } from 'next/cache'
 
interface BookingsProps {
  type: string
}
 
export async function Bookings({ type = 'haircut' }: BookingsProps) {
  async function getBookingsData() {
    'use cache'
    const data = await fetch(`/api/bookings?type=${encodeURIComponent(type)}`)
    cacheTag('bookings-data', data.id)
    return data
  }
  return //...
}
Invalidating tagged cache
Using revalidateTag, you can invalidate the cache for a specific tag when needed:

app/actions.ts
TypeScript

TypeScript
'use server'
 
import { revalidateTag } from 'next/cache'
 
export async function updateBookings() {
  await updateBookingData()
  revalidateTag('bookings-data')
}
Related
View related API references.
cacheComponents
Learn how to enable the cacheComponents flag in Next.js.
use cache
Learn how to use the "use cache" directive to cache data in your Next.js application.
revalidateTag
API Reference for the revalidateTag function.
updateTag
API Reference for the updateTag function.
cacheLife
Learn how to use the cacheLife function to set the cache expiration time for a cached


=====================================use cache
Last updated May 19, 2026
The use cache directive allows you to mark a route, React component, or a function as cacheable. It can be used at the top of a file to indicate that all exports in the file should be cached, or inline at the top of function or component to cache the return value.

Good to know:

To use cookies or headers, read them outside cached scopes and pass values as arguments. This is the preferred pattern.
If the in-memory cache isn't sufficient for runtime data, 'use cache: remote' allows platforms to provide a dedicated cache handler, though it requires a network roundtrip to check the cache and typically incurs platform fees.
For compliance requirements or when you can't refactor to pass runtime data as arguments to a use cache scope, see 'use cache: private'.
Usage
use cache is a Cache Components feature. To enable it, add the cacheComponents option to your next.config.ts file:

next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheComponents: true,
}
 
export default nextConfig
Then, add use cache at the file, component, or function level:

// File level
'use cache'
 
export default async function Page() {
  // ...
}
 
// Component level
export async function MyComponent() {
  'use cache'
  return <></>
}
 
// Function level
export async function getData() {
  'use cache'
  const data = await fetch('/api/data')
  return data
}
Good to know: When used at file level, all function exports must be async functions.

How use cache works
Cache keys
A cache entry's key is generated using a serialized version of its inputs, which includes:

Build ID - Unique per build, changing this invalidates all cache entries
Function ID - A secure hash of the function's location and signature in the codebase
Serializable arguments - Props (for components) or function arguments
HMR refresh hash (development only) - Invalidates cache on hot module replacement
When a cached function references variables from outer scopes, those variables are automatically captured and bound as arguments, making them part of the cache key.

lib/data.ts
async function Component({ userId }: { userId: string }) {
  const getData = async (filter: string) => {
    'use cache'
    // Cache key includes both userId (from closure) and filter (argument)
    return fetch(`/api/users/${userId}/data?filter=${filter}`)
  }
 
  return getData('active')
}
In the snippet above, userId is captured from the outer scope and filter is passed as an argument, so both become part of the getData function's cache key. This means different user and filter combinations will have separate cache entries.

Serialization
Arguments to cached functions and their return values must be serializable.

For a complete reference, see:

Serializable arguments - Uses React Server Components serialization
Serializable return types - Uses React Client Components serialization
Good to know: Arguments and return values use different serialization systems. Server Component serialization (for arguments) is more restrictive than Client Component serialization (for return values). This means you can return JSX elements but cannot accept them as arguments unless using pass-through patterns.

Supported types
Arguments:

Primitives: string, number, boolean, null, undefined
Plain objects: { key: value }
Arrays: [1, 2, 3]
Dates, Maps, Sets, TypedArrays, ArrayBuffers
React elements (as pass-through only)
Return values:

Same as arguments, plus JSX elements
Unsupported types
Class instances
Functions (except as pass-through)
Symbols, WeakMaps, WeakSets
URL instances
app/components/user-card.tsx
// Valid - primitives and plain objects
async function UserCard({
  id,
  config,
}: {
  id: string
  config: { theme: string }
}) {
  'use cache'
  return <div>{id}</div>
}
 
// Invalid - class instance
async function UserProfile({ user }: { user: UserClass }) {
  'use cache'
  // Error: Cannot serialize class instance
  return <div>{user.name}</div>
}
Pass-through (non-serializable arguments)
You can accept non-serializable values as long as you don't introspect them. This enables composition patterns with children and Server Actions:

app/components/cached-wrapper.tsx
async function CachedWrapper({ children }: { children: ReactNode }) {
  'use cache'
  // Don't read or modify children - just pass it through
  return (
    <div className="wrapper">
      <header>Cached Header</header>
      {children}
    </div>
  )
}
 
// Usage: children can be dynamic
export default function Page() {
  return (
    <CachedWrapper>
      <DynamicComponent /> {/* Not cached, passed through */}
    </CachedWrapper>
  )
}
You can also pass Server Actions through cached components:

app/components/cached-form.tsx
async function CachedForm({ action }: { action: () => Promise<void> }) {
  'use cache'
  // Don't call action here - just pass it through
  return <form action={action}>{/* ... */}</form>
}
Constraints
Cached functions execute in an isolated environment. The following constraints ensure cache behavior remains predictable and secure.

Request-time APIs
Cached functions and components cannot directly access runtime APIs like cookies(), headers(), or searchParams. Instead, read these values outside the cached scope and pass them as arguments.

Runtime caching considerations
While use cache is designed primarily to include uncached data in the static shell, it can also cache data at runtime using in-memory LRU (Least Recently Used) storage.

Runtime cache behavior depends on your hosting environment:

Environment	Runtime Caching Behavior
Serverless	Cache entries typically don't persist across requests (each request can be a different instance), or during revalidation. Build-time caching works normally.
Self-hosted	Cache entries persist across requests. Control cache size with cacheMaxMemorySize.
For example, in a serverless environment, a cached function shared by two pages executes on each static shell revalidation, whereas in self-hosted or environments with persistent memory, the cached output is reused if it's still fresh.

If the default in-memory cache isn't enough, consider use cache: remote which allows platforms to provide a dedicated cache handler (like Redis or KV database). This helps reduce hits against data sources not scaled to your total traffic, though it comes with costs (storage, network latency, platform fees).

Very rarely, for compliance requirements or when you can't refactor your code to pass runtime data as arguments to a use cache scope, you might need use cache: private.

Draft Mode
When Draft Mode is enabled, all cached functions and components re-execute on every request, and results are not saved to the cache. This ensures draft content is always fresh without requiring any changes to your caching code.

You can read isEnabled from draftMode() inside a use cache scope, however, other runtime APIs like cookies() and headers() are not allowed, even when Draft Mode is active. See Passing runtime values to cached functions for the recommended pattern.

app/components/content.tsx
import { draftMode } from 'next/headers'
 
async function Content() {
  'use cache'
 
  const { isEnabled } = await draftMode()
  const url = isEnabled
    ? 'https://draft.example.com/content'
    : 'https://production.example.com/content'
 
  const data = await fetch(url)
  return <article>{/* ... */}</article>
}
Calling enable() or disable() inside a caching directive scope will also throw an error. Draft Mode can only be toggled in Route Handlers or Server Actions.

React.cache isolation
React.cache operates in an isolated scope inside use cache boundaries. Values stored via React.cache outside a use cache function are not visible inside it.

This means you cannot use React.cache to pass data into a use cache scope:

import { cache } from 'react'
 
const store = cache(() => ({ current: null as string | null }))
 
function Parent() {
  const shared = store()
  shared.current = 'value from parent'
  return <Child />
}
 
async function Child() {
  'use cache'
  const shared = store()
  // shared.current is null, not 'value from parent'
  // use cache has its own isolated React.cache scope
  return <div>{shared.current}</div>
}
This isolation ensures cached functions have predictable, self-contained behavior. To pass data into a use cache scope, use function arguments instead.

use cache at runtime
On the server, cache entries are stored in-memory and respect the revalidate and expire times from your cacheLife configuration. You can customize the cache storage by configuring cacheHandlers in your next.config.js file.

On the client, content from the server cache is stored in the browser's memory for the duration defined by the stale time. The client router enforces a minimum 30-second stale time, regardless of configuration.

The x-nextjs-stale-time response header communicates cache lifetime from server to client, ensuring coordinated behavior.

Revalidation
By default, use cache uses the default profile with these settings:

stale: 5 minutes (client-side)
revalidate: 15 minutes (server-side)
expire: Never expires by time
lib/data.ts
async function getData() {
  'use cache'
  // Implicitly uses default profile
  return fetch('/api/data')
}
Customizing cache lifetime
Use the cacheLife function to customize cache duration:

lib/data.ts
import { cacheLife } from 'next/cache'
 
async function getData() {
  'use cache'
  cacheLife('hours') // Use built-in 'hours' profile
  return fetch('/api/data')
}
On-demand revalidation
Use cacheTag, updateTag, or revalidateTag for on-demand cache invalidation:

lib/data.ts
import { cacheTag } from 'next/cache'
 
async function getProducts() {
  'use cache'
  cacheTag('products')
  return fetch('/api/products')
}
app/actions.ts
'use server'
 
import { updateTag } from 'next/cache'
 
export async function updateProduct() {
  await db.products.update(...)
  updateTag('products') // Invalidates all 'products' caches
}
Both cacheLife and cacheTag integrate across client and server caching layers, meaning you configure your caching semantics in one place and they apply everywhere.

Examples
Caching an entire route with use cache
To prerender an entire route, add use cache to the top of both the layout and page files. Each of these segments are treated as separate entry points in your application, and will be cached independently.

app/layout.tsx
TypeScript

TypeScript
'use cache'
 
export default async function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
Any components imported and nested in page file are part of the cache output associated with the page.

app/page.tsx
TypeScript

TypeScript
'use cache'
 
async function Users() {
  const users = await fetch('/api/users')
  // loop through users
}
 
export default async function Page() {
  return (
    <main>
      <Users />
    </main>
  )
}
Good to know:

If use cache is added only to the layout or the page, only that route segment and any components imported into it will be cached.
Caching a component's output with use cache
You can use use cache at the component level to cache any fetches or computations performed within that component. The cache entry will be reused as long as the serialized props produce the same value in each instance.

app/components/bookings.tsx
TypeScript

TypeScript
export async function Bookings({ type = 'haircut' }: BookingsProps) {
  'use cache'
  async function getBookingsData() {
    const data = await fetch(`/api/bookings?type=${encodeURIComponent(type)}`)
    return data
  }
  return //...
}
 
interface BookingsProps {
  type: string
}
Caching function output with use cache
Since you can add use cache to any asynchronous function, you aren't limited to caching components or routes only. You might want to cache a network request, a database query, or a slow computation.

app/actions.ts
TypeScript

TypeScript
export async function getData() {
  'use cache'
 
  const data = await fetch('/api/data')
  return data
}
Interleaving
In React, composition with children or slots is a well-known pattern for building flexible components. When using use cache, you can continue to compose your UI in this way. Anything included as children, or other compositional slots, in the returned JSX will be passed through the cached component without affecting its cache entry.

As long as you don't directly reference any of the JSX slots inside the body of the cacheable function itself, their presence in the returned output won't affect the cache entry.

app/page.tsx
TypeScript

TypeScript
export default async function Page() {
  const uncachedData = await getData()
  return (
    // Pass compositional slots as props, e.g. header and children
    <CacheComponent header={<h1>Home</h1>}>
      {/* DynamicComponent is provided as the children slot */}
      <DynamicComponent data={uncachedData} />
    </CacheComponent>
  )
}
 
async function CacheComponent({
  header, // header: a compositional slot, injected as a prop
  children, // children: another slot for nested composition
}: {
  header: ReactNode
  children: ReactNode
}) {
  'use cache'
  const cachedData = await fetch('/api/cached-data')
  return (
    <div>
      {header}
      <PrerenderedComponent data={cachedData} />
      {children}
    </div>
  )
}
You can also pass Server Actions through cached components to Client Components without invoking them inside the cacheable function.

app/page.tsx
TypeScript

TypeScript
import ClientComponent from './ClientComponent'
 
export default async function Page() {
  const performUpdate = async () => {
    'use server'
    // Perform some server-side update
    await db.update(...)
  }
 
  return <CachedComponent performUpdate={performUpdate} />
}
 
async function CachedComponent({
  performUpdate,
}: {
  performUpdate: () => Promise<void>
}) {
  'use cache'
  // Do not call performUpdate here
  return <ClientComponent action={performUpdate} />
}
app/ClientComponent.tsx
TypeScript

TypeScript
'use client'
 
export default function ClientComponent({
  action,
}: {
  action: () => Promise<void>
}) {
  return <button onClick={action}>Update</button>
}
Troubleshooting
Debugging cache behavior
Verbose logging
Set NEXT_PRIVATE_DEBUG_CACHE=1 for verbose cache logging:

NEXT_PRIVATE_DEBUG_CACHE=1 npm run dev
# or for production
NEXT_PRIVATE_DEBUG_CACHE=1 npm run start
Good to know: This environment variable also logs ISR and other caching mechanisms. See Verifying correct production behavior for more details.

Console log replays
In development, console logs from cached functions appear with a Cache prefix.

Build Hangs (Cache Timeout)
If your build hangs, you're accessing Promises that resolve to uncached or runtime data, created outside a use cache boundary. The cached function waits for data that can't resolve during the build, causing a timeout after 50 seconds.

When the build timeouts you'll see this error message:

Error: Filling a cache during prerender timed out, likely because request-specific arguments such as params, searchParams, cookies() or uncached data were used inside "use cache".

Common ways this happens: passing such Promises as props, accessing them via closure, or retrieving them from shared storage (Maps).

Good to know: Directly calling cookies() or headers() inside use cache fails immediately with a different error, not a timeout.

Passing runtime data Promises as props:

app/page.tsx
import { cookies } from 'next/headers'
import { Suspense } from 'react'
 
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dynamic />
    </Suspense>
  )
}
 
async function Dynamic() {
  const cookieStore = cookies()
  return <Cached promise={cookieStore} /> // Build hangs
}
 
async function Cached({ promise }: { promise: Promise<unknown> }) {
  'use cache'
  const data = await promise // Waits for runtime data during build
  return <p>..</p>
}
Await the cookies store in the Dynamic component, and pass a cookie value to the Cached component.

Shared deduplication storage:

app/page.tsx
// Problem: Map stores dynamic Promises, accessed by cached code
import { Suspense } from 'react'
 
const cache = new Map<string, Promise<string>>()
 
export default function Page() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Dynamic id="data" />
      </Suspense>
      <Cached id="data" />
    </>
  )
}
 
async function Dynamic({ id }: { id: string }) {
  // Stores dynamic Promise in shared Map
  cache.set(
    id,
    fetch(`https://api.example.com/${id}`).then((r) => r.text())
  )
  return <p>Dynamic</p>
}
 
async function Cached({ id }: { id: string }) {
  'use cache'
  return <p>{await cache.get(id)}</p> // Build hangs - retrieves dynamic Promise
}
Use Next.js's built-in fetch() deduplication or use separate Maps for cached and uncached contexts.

Platform Support
Deployment Option	Supported
Node.js server	Yes
Docker container	Yes
Static export	No
Adapters	Platform-specific
Learn how to configure caching when self-hosting Next.js.

Version History
Version	Changes
v16.0.0	"use cache" is enabled with the Cache Components feature.
v15.0.0	"use cache" is introduced as an experimental feature.


========================
cacheLife
Last updated May 19, 2026
The cacheLife option allows you to define custom cache profiles when using the cacheLife function inside components or functions, and within the scope of the use cache directive.

Usage
To define a profile, enable the cacheComponents flag and add the cache profile in the cacheLife object in the next.config.js file. For example, a blog profile:

next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    blog: {
      stale: 3600, // 1 hour
      revalidate: 900, // 15 minutes
      expire: 86400, // 1 day
    },
  },
}
 
export default nextConfig
You can now use this custom blog configuration in your component or function as follows:

app/actions.ts
TypeScript

TypeScript
import { cacheLife } from 'next/cache'
 
export async function getCachedData() {
  'use cache'
  cacheLife('blog')
  const data = await fetch('/api/data')
  return data
}
Reference
The configuration object has key values with the following format:

Property	Value	Description	Requirement
stale	number	Duration the client should cache a value without checking the server.	Optional
revalidate	number	Frequency at which the cache should refresh on the server; stale values may be served while revalidating.	Optional
expire	number	Maximum duration for which a value can remain stale before switching to dynamic.	Optional - Must be longer than revalidate
Related
View related API references.
use cache
Learn how to use the "use cache" directive to cache data in your Next.js application.
cacheHandlers
Configure custom cache handlers for use cache directives in Next.js.
cacheLife
Learn how to use the cacheLife function to set the cache expiration time for a cached function or component.


===================
cacheHandlers
Last updated May 19, 2026
The cacheHandlers configuration allows you to define custom cache storage implementations for 'use cache' and 'use cache: remote'. This enables you to store cached components and functions in external services or customize the caching behavior. 'use cache: private' is not configurable.

When to use custom cache handlers
Most applications don't need custom cache handlers. The default in-memory cache works well in the typical use case.

Custom cache handlers are for advanced scenarios where you need to either share cache across multiple instances or change where the cache is stored. For example, you can configure a custom remote handler for external storage (like a key-value store), then use 'use cache' in your code for in-memory caching and 'use cache: remote' for the external storage, allowing different caching strategies within the same application.

Sharing cache across instances

The default in-memory cache is isolated to each Next.js process. If you're running multiple servers or containers, each instance will have its own cache that isn't shared with others and is lost on restart.

Custom handlers let you integrate with shared storage systems (like Redis, Memcached, or DynamoDB) that all your Next.js instances can access.

Changing storage type

You might want to store cache differently than the default in-memory approach. You can implement a custom handler to store cache on disk, in a database, or in an external caching service. Reasons include: persistence across restarts, reducing memory usage, or integrating with existing infrastructure.

Usage
To configure custom cache handlers:

Define your cache handler in a separate file, see examples for implementation details.
Reference the file path in your Next config file
next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheHandlers: {
    default: require.resolve('./cache-handlers/default-handler.js'),
    remote: require.resolve('./cache-handlers/remote-handler.js'),
  },
}
 
export default nextConfig
Handler types
default: Used by the 'use cache' directive
remote: Used by the 'use cache: remote' directive
If you don't configure cacheHandlers, Next.js uses an in-memory LRU (Least Recently Used) cache for both default and remote. You can view the default implementation as a reference.

You can also define additional named handlers (e.g., sessions, analytics) and reference them with 'use cache: <name>'.

Note that 'use cache: private' does not use cache handlers and cannot be customized.

API Reference
A cache handler must implement the CacheHandler interface with the following methods:

get()
Retrieve a cache entry for the given cache key.

get(cacheKey: string, softTags: string[]): Promise<CacheEntry | undefined>
Parameter	Type	Description
cacheKey	string	The unique key for the cache entry.
softTags	string[]	Implicit tags derived from the route path. See Soft Tags for how to use them.
Returns a CacheEntry object if found, or undefined if not found or expired.

Your get method should retrieve the cache entry from storage, check if it has expired based on the revalidate time, and return undefined for missing or expired entries.

const cacheHandler = {
  async get(cacheKey, softTags) {
    const entry = cache.get(cacheKey)
    if (!entry) return undefined
 
    // Check if expired
    const now = Date.now()
    if (now > entry.timestamp + entry.revalidate * 1000) {
      return undefined
    }
 
    return entry
  },
}
set()
Store a cache entry for the given cache key.

set(cacheKey: string, pendingEntry: Promise<CacheEntry>): Promise<void>
Parameter	Type	Description
cacheKey	string	The unique key to store the entry under.
pendingEntry	Promise<CacheEntry>	A promise that resolves to the cache entry.
The entry may still be pending when this is called (i.e., its value stream may still be written to). Your handler should await the promise before processing the entry.

Returns Promise<void>.

Your set method must await the pendingEntry promise before storing it, since the cache entry may still be generating when this method is called. Once resolved, store the entry in your cache system.

const cacheHandler = {
  async set(cacheKey, pendingEntry) {
    // Wait for the entry to be ready
    const entry = await pendingEntry
 
    // Store in your cache system
    cache.set(cacheKey, entry)
  },
}
refreshTags()
Called periodically before starting a new request to sync with external tag services.

refreshTags(): Promise<void>
This is useful if you're coordinating cache invalidation across multiple instances or services. For in-memory caches, this can be a no-op.

Returns Promise<void>.

For in-memory caches, this can be a no-op. For distributed caches, use this to sync tag state from an external service or database before processing requests.

const cacheHandler = {
  async refreshTags() {
    // For in-memory cache, no action needed
    // For distributed cache, sync tag state from external service
  },
}
getExpiration()
Get the maximum revalidation timestamp for a set of tags.

getExpiration(tags: string[]): Promise<number>
Parameter	Type	Description
tags	string[]	Array of tags to check expiration for.
Returns:

0 if none of the tags were ever revalidated
A timestamp (in milliseconds) representing the most recent revalidation
Infinity to indicate soft tags should be checked in the get method instead
If you're not tracking tag revalidation timestamps, return 0. Otherwise, find the most recent revalidation timestamp across all the provided tags. Return Infinity if you prefer to handle soft tag checking in the get method.

const cacheHandler = {
  async getExpiration(tags) {
    // Return 0 if not tracking tag revalidation
    return 0
 
    // Or return the most recent revalidation timestamp
    // return Math.max(...tags.map(tag => tagTimestamps.get(tag) || 0));
  },
}
updateTags()
Called when tags are revalidated or expired.

updateTags(tags: string[], durations?: { expire?: number }): Promise<void>
Parameter	Type	Description
tags	string[]	Array of tags to update.
durations	{ expire?: number }	Optional expiration duration in seconds.
Your handler should update its internal state to mark these tags as invalidated.

Returns Promise<void>.

When tags are revalidated, your handler should invalidate all cache entries that have any of those tags. Iterate through your cache and remove entries whose tags match the provided list.

const cacheHandler = {
  async updateTags(tags, durations) {
    // Invalidate all cache entries with matching tags
    for (const [key, entry] of cache.entries()) {
      if (entry.tags.some((tag) => tags.includes(tag))) {
        cache.delete(key)
      }
    }
  },
}
CacheEntry Type
The CacheEntry object has the following structure:

interface CacheEntry {
  value: ReadableStream<Uint8Array>
  tags: string[]
  stale: number
  timestamp: number
  expire: number
  revalidate: number
}
Property	Type	Description
value	ReadableStream<Uint8Array>	The cached data as a stream.
tags	string[]	Cache tags (excluding soft tags).
stale	number	Duration in seconds for client-side staleness.
timestamp	number	When the entry was created (timestamp in milliseconds).
expire	number	How long the entry is allowed to be used (in seconds).
revalidate	number	How long until the entry should be revalidated (in seconds).
Good to know:

The value is a ReadableStream. Use .tee() if you need to read and store the stream data.
If the stream errors with partial data, your handler must decide whether to keep the partial cache or discard it.
Examples
Basic in-memory cache handler
Here's a minimal implementation using a Map for storage. This example demonstrates the core concepts, but for a production-ready implementation with LRU eviction, error handling, and tag management, see the default cache handler.

cache-handlers/memory-handler.js
const cache = new Map()
const pendingSets = new Map()
 
module.exports = {
  async get(cacheKey, softTags) {
    // Wait for any pending set operation to complete
    const pendingPromise = pendingSets.get(cacheKey)
    if (pendingPromise) {
      await pendingPromise
    }
 
    const entry = cache.get(cacheKey)
    if (!entry) {
      return undefined
    }
 
    // Check if entry has expired
    const now = Date.now()
    if (now > entry.timestamp + entry.revalidate * 1000) {
      return undefined
    }
 
    return entry
  },
 
  async set(cacheKey, pendingEntry) {
    // Create a promise to track this set operation
    let resolvePending
    const pendingPromise = new Promise((resolve) => {
      resolvePending = resolve
    })
    pendingSets.set(cacheKey, pendingPromise)
 
    try {
      // Wait for the entry to be ready
      const entry = await pendingEntry
 
      // Store the entry in the cache
      cache.set(cacheKey, entry)
    } finally {
      resolvePending()
      pendingSets.delete(cacheKey)
    }
  },
 
  async refreshTags() {
    // No-op for in-memory cache
  },
 
  async getExpiration(tags) {
    // Return 0 to indicate no tags have been revalidated
    return 0
  },
 
  async updateTags(tags, durations) {
    // Implement tag-based invalidation
    for (const [key, entry] of cache.entries()) {
      if (entry.tags.some((tag) => tags.includes(tag))) {
        cache.delete(key)
      }
    }
  },
}
External storage pattern
For durable storage like Redis or a database, you'll need to serialize the cache entries. Here's a simple Redis example:

cache-handlers/redis-handler.js
const { createClient } = require('redis')
 
const client = createClient({ url: process.env.REDIS_URL })
client.connect()
 
module.exports = {
  async get(cacheKey, softTags) {
    // Retrieve from Redis
    const stored = await client.get(cacheKey)
    if (!stored) return undefined
 
    // Deserialize the entry
    const data = JSON.parse(stored)
 
    // Reconstruct the ReadableStream from stored data
    return {
      value: new ReadableStream({
        start(controller) {
          controller.enqueue(Buffer.from(data.value, 'base64'))
          controller.close()
        },
      }),
      tags: data.tags,
      stale: data.stale,
      timestamp: data.timestamp,
      expire: data.expire,
      revalidate: data.revalidate,
    }
  },
 
  async set(cacheKey, pendingEntry) {
    const entry = await pendingEntry
 
    // Read the stream to get the data
    const reader = entry.value.getReader()
    const chunks = []
 
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
 
    // Combine chunks and serialize for Redis storage
    const data = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
 
    await client.set(
      cacheKey,
      JSON.stringify({
        value: data.toString('base64'),
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      }),
      { EX: entry.expire } // Use Redis TTL for automatic expiration
    )
  },
 
  async refreshTags() {
    // No-op for basic Redis implementation
    // Could sync with external tag service if needed
  },
 
  async getExpiration(tags) {
    // Return 0 to indicate no tags have been revalidated
    // Could query Redis for tag expiration timestamps if tracking them
    return 0
  },
 
  async updateTags(tags, durations) {
    // Implement tag-based invalidation if needed
    // Could iterate over keys with matching tags and delete them
  },
}
Distributed Tag Coordination
When running multiple Next.js instances, tag invalidation must be coordinated across instances. The default in-memory handler only tracks tags locally, so calling revalidateTag() on one instance does not affect others.

To coordinate tags across instances:

updateTags() is called when revalidateTag() is invoked. Your handler should write the invalidation timestamp to shared storage.
refreshTags() is called before each request. Your handler should read recent invalidation events from shared storage and update its local tag state.
getExpiration() returns the most recent revalidation timestamp across all provided tags. The default implementation returns Math.max(...timestamps, 0).
Here's an example using Redis for distributed tag coordination:

cache-handlers/distributed-tags.js
const { createClient } = require('redis')
 
const client = createClient({ url: process.env.REDIS_URL })
client.connect()
 
// Local cache of tag timestamps, synced via refreshTags
const localTagTimestamps = new Map()
 
module.exports = {
  // ... get() and set() methods ...
 
  async refreshTags() {
    // Sync tag invalidation timestamps from Redis
    // Using a dedicated set to track tag keys avoids scanning the keyspace
    const tagKeys = await client.sMembers('revalidated-tags')
    if (tagKeys.length > 0) {
      const values = await client.mGet(tagKeys.map((k) => `tag:${k}`))
      for (let i = 0; i < tagKeys.length; i++) {
        localTagTimestamps.set(tagKeys[i], Number(values[i]))
      }
    }
  },
 
  async getExpiration(tags) {
    const timestamps = tags.map((tag) => localTagTimestamps.get(tag) || 0)
    return Math.max(...timestamps, 0)
  },
 
  async updateTags(tags, durations) {
    const now = Date.now()
    const pipeline = client.multi()
    for (const tag of tags) {
      pipeline.set(`tag:${tag}`, String(now))
      pipeline.sAdd('revalidated-tags', tag)
      localTagTimestamps.set(tag, now)
    }
    await pipeline.exec()
  },
}
For a full explanation of the tag architecture (including soft tags and multi-instance considerations), see How Revalidation Works.

Soft Tags
Soft tags are implicit tags that Next.js automatically generates based on the route path. For example, the route /blog/hello generates soft tags for /, /blog, /blog/hello, and their corresponding layout entries. These tags are prefixed internally with _N_T_.

Soft tags enable revalidatePath() to work through the same tag-based cache system. When revalidatePath('/blog/hello') is called, it invalidates all cache entries associated with that path's soft tags.

In the cache handler API, soft tags are passed to the get() method as the softTags parameter. Your handler should check whether any soft tag has been invalidated (via getExpiration() or direct timestamp comparison) after the cache entry's timestamp. If a soft tag was invalidated more recently than the entry was created, the entry should be treated as stale.

Handling Streams
The CacheEntry.value is a ReadableStream<Uint8Array>. When implementing a cache handler that stores entries externally, keep in mind:

Use .tee() if you need to both store and return the stream. One branch goes to storage, the other is returned to the caller.
Memory implications: large pages produce large cache entries. For S3-like storage backends, consider streaming directly to storage without buffering the entire entry in memory.
Partial writes: the stream may error partway through rendering. Your handler should decide whether to keep partial entries or discard them. Discarding is safer, as partial entries can produce incomplete pages.
Error Handling
Cache operations should be implemented defensively:

set() failure: the response is still served to the user because set() is called asynchronously after the response stream is already flowing. The cache entry is lost, and the next request triggers a fresh render.
get() failure: your handler should catch internal errors and return undefined (the "cache miss" signal). The framework does not wrap get() in a try/catch, so an unhandled exception from get() will propagate as a render error.
Partial writes: if a cache entry is partially written and then read, the behavior is undefined. Use atomic writes or a write-then-rename pattern to avoid serving partial entries.
=

=====================================
use cache: remote
Last updated May 19, 2026
While the use cache directive is sufficient for most application needs, you might notice that cached operations are re-running more often than expected, or that your upstream services (CMS, databases, external APIs) are getting more hits than you'd expect. This can happen because use cache stores entries in-memory, which has inherent limitations:

Cache entries being evicted to make room for new ones
Memory constraints in your deployment environment
Cache not persisting across requests or server restarts
Note that use cache still provides value beyond server-side caching: it informs Next.js what can be prefetched and defines stale times for client-side navigation.

The 'use cache: remote' directive lets you declaratively specify that a cached output should be stored in a remote cache instead of in-memory, providing durable caching shared across all server instances. This comes with tradeoffs: infrastructure cost and network latency during cache lookups.

Usage
To use 'use cache: remote', enable the cacheComponents flag in your next.config.ts file:

next.config.ts
TypeScript

TypeScript
import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  cacheComponents: true,
}
 
export default nextConfig
Then add 'use cache: remote' to the functions or components where you've determined remote caching is justified. The handler implementation is configured via cacheHandlers, though hosting providers should typically provide this automatically. If you're self-hosting, see the cacheHandlers configuration reference to set up your cache storage.

When to avoid remote caching
If you already have a server-side cache key-value store wrapping your data layer, use cache may be sufficient to include data in the static shell without adding another caching layer
If operations are already fast (< 50ms) due to proximity or local access, the remote cache lookup might not improve performance
If cache keys have mostly unique values per request (search filters, price ranges, user-specific parameters), cache utilization will be near-zero
If data changes frequently (seconds to minutes), cache hits will quickly go stale, leading to frequent misses and waiting for upstream revalidation
When remote caching makes sense
Remote caching provides the most value when content is deferred to request time (outside the static shell). This typically happens when a component accesses request values like cookies(), headers(), or searchParams, placing it inside a Suspense boundary. In this context:

Each request executes the component and looks up the cache
In serverless environments, each instance has its own ephemeral memory with low cache hit rates
Remote caching provides a shared cache across all instances, improving hit rates and reducing backend load
Compelling scenarios for 'use cache: remote':

Rate-limited APIs: Your upstream service has rate limits or request quotas that you risk hitting
Protecting slow backends: Your database or API becomes a bottleneck under high traffic
Expensive operations: Database queries or computations that are costly to run repeatedly
Flaky or unreliable services: External services that occasionally fail or have availability issues
In these cases, the cost and latency of remote caching is justified by avoiding worse outcomes (rate limit errors, backend overload, high compute bills, or degraded user experience).

For static shell content, use cache is usually sufficient. If your upstream source can't handle concurrent revalidation requests (like a rate-limited CMS), use cache: remote acts as a shared cache layer. This is the same pattern as putting a key-value store in front of a database, but declared in code.

How use cache: remote differs from use cache and use cache: private
Next.js provides three caching directives, each designed for different use cases:

Feature	use cache	'use cache: remote'	'use cache: private'
Server-side caching	In-memory or cache handler	Remote cache handler	None
Cache scope	Shared across all users	Shared across all users	Per-client (browser)
Can access cookies/headers directly	No (must pass as arguments)	No (must pass as arguments)	Yes
Server cache utilization	May be low outside static shell	High (shared across instances)	N/A
Additional costs	None	Infrastructure (storage, network)	None
Latency impact	None	Cache handler lookup	None
Caching with runtime data
Both use cache and 'use cache: remote' can't access runtime values like cookies or search params directly. You can extract these values and pass them as arguments to cached functions. See with runtime data for this pattern.

Good to know: use cache stores entries in-memory. In serverless environments, memory is not shared between instances and is typically destroyed after serving a request, leading to frequent cache misses for runtime caching.

Cache key considerations
Be thoughtful about which values you include in cache keys. Each unique value creates a separate cache entry, reducing cache utilization. Consider this example with search filters:

app/products/[category]/page.tsx
import { Suspense } from 'react'
 
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ minPrice?: string }>
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductList params={params} searchParams={searchParams} />
    </Suspense>
  )
}
 
async function ProductList({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>
  searchParams: Promise<{ minPrice?: string }>
}) {
  const { category } = await params
 
  const { minPrice } = await searchParams
 
  // Cache only on category (few unique values)
  // Don't include price filter (many unique values)
  const products = await getProductsByCategory(category)
 
  // Filter price in memory instead of creating cache entries
  // for every price value
  const filtered = minPrice
    ? products.filter((p) => p.price >= parseFloat(minPrice))
    : products
 
  return <div>{/* render filtered products */}</div>
}
 
async function getProductsByCategory(category: string) {
  'use cache: remote'
  // Only category is part of the cache key
  // Much better utilization than caching every price filter value
  return db.products.findByCategory(category)
}
In this example, the remote handler stores more data per cache entry (all products in a category) to achieve better cache hit rates. This is worth it when the cost of cache misses (hitting your backend) outweighs the storage cost of larger entries.

The same principle applies to user-specific data. Rather than caching per-user data directly, use user preferences to determine what shared data to cache.

For example, if users have a language preference in their session, extract that preference and use it to cache shared content:

Instead of remote caching getUserProfile(sessionID), which creates one entry per user
Remote cache getCMSContent(language) to create one entry per language
app/components/welcome-message.tsx
import { cookies } from 'next/headers'
import { cacheLife } from 'next/cache'
 
export async function WelcomeMessage() {
  // Extract the language preference (not unique per user)
  const language = (await cookies()).get('language')?.value || 'en'
 
  // Cache based on language (few unique values: en, es, fr, de, etc.)
  // All users who prefer 'en' share the same cache entry
  const content = await getCMSContent(language)
 
  return <div>{content.welcomeMessage}</div>
}
 
async function getCMSContent(language: string) {
  'use cache: remote'
  cacheLife({ expire: 3600 })
  // Creates ~10-50 cache entries (one per language)
  // instead of thousands (one per user)
  return cms.getHomeContent(language)
}
This way all users who prefer the same language share a cache entry, improving cache utilization and reducing load on your CMS.

The pattern is the same in both examples: find the dimension with fewer unique values (category vs. price, language vs. user ID), cache on that dimension, and filter or select the rest in memory.

If the service used by getUserProfile cannot scale with your frontend load, you may still be able to use the use cache directive with a short cacheLife for in-memory caching. However, for most user data, you likely want to fetch directly from the source (which might already be wrapped in a key/value store as mentioned in the guidelines above).

Only use 'use cache: private' if you have compliance requirements or can't refactor to pass runtime data as arguments.

Nesting rules
Remote caches have specific nesting rules:

Remote caches can be nested inside other remote caches ('use cache: remote')
Remote caches can be nested inside regular caches ('use cache')
Remote caches cannot be nested inside private caches ('use cache: private')
Private caches cannot be nested inside remote caches
// VALID: Remote inside remote
async function outerRemote() {
  'use cache: remote'
  const result = await innerRemote()
  return result
}
 
async function innerRemote() {
  'use cache: remote'
  return getData()
}
 
// VALID: Remote inside regular cache
async function outerCache() {
  'use cache'
  // The inner remote cache will work when deferred to request time
  const result = await innerRemote()
  return result
}
 
async function innerRemote() {
  'use cache: remote'
  return getData()
}
 
// INVALID: Remote inside private
async function outerPrivate() {
  'use cache: private'
  const result = await innerRemote() // Error!
  return result
}
 
async function innerRemote() {
  'use cache: remote'
  return getData()
}
 
// INVALID: Private inside remote
async function outerRemote() {
  'use cache: remote'
  const result = await innerPrivate() // Error!
  return result
}
 
async function innerPrivate() {
  'use cache: private'
  return getData()
}
Examples
The following examples demonstrate common patterns for using 'use cache: remote'. For details about cacheLife parameters (stale, revalidate, expire), see the cacheLife API reference.

With user preferences
Cache product pricing based on the user's currency preference. Since the currency is stored in a cookie, this component renders at request time. Remote caching is valuable here because all users with the same currency share the cached price, and in serverless environments, all instances share the same remote cache.

app/product/[id]/page.tsx
TypeScript

TypeScript
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheTag, cacheLife } from 'next/cache'
 
export async function generateStaticParams() {
  return [{ id: '1' }, { id: '2' }, { id: '3' }]
}
 
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
 
  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading price...</div>}>
        <ProductPrice productId={id} />
      </Suspense>
    </div>
  )
}
 
function ProductDetails({ id }: { id: string }) {
  return <div>Product: {id}</div>
}
 
async function ProductPrice({ productId }: { productId: string }) {
  // Reading cookies defers this component to request time
  const currency = (await cookies()).get('currency')?.value ?? 'USD'
 
  // Cache the price per product and currency combination
  // All users with the same currency share this cache entry
  const price = await getProductPrice(productId, currency)
 
  return (
    <div>
      Price: {price} {currency}
    </div>
  )
}
 
async function getProductPrice(productId: string, currency: string) {
  'use cache: remote'
  cacheTag(`product-price-${productId}`)
  cacheLife({ expire: 3600 }) // 1 hour
 
  // Cached per (productId, currency) - few currencies means high cache utilization
  return db.products.getPrice(productId, currency)
}
Reducing database load
Cache expensive database queries, reducing load on your database. In this example, we don't access cookies(), headers(), or searchParams. If we had a requirement to not include these stats in the static shell, we could use connection() to explicitly defer to request time:

app/dashboard/page.tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import { cacheLife, cacheTag } from 'next/cache'
 
export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading stats...</div>}>
      <DashboardStats />
    </Suspense>
  )
}
 
async function DashboardStats() {
  // Defer to request time
  await connection()
 
  const stats = await getGlobalStats()
 
  return <StatsDisplay stats={stats} />
}
 
async function getGlobalStats() {
  'use cache: remote'
  cacheTag('global-stats')
  cacheLife({ expire: 60 }) // 1 minute
 
  // This expensive database query is cached and shared across all users,
  // reducing load on your database
  const stats = await db.analytics.aggregate({
    total_users: 'count',
    active_sessions: 'count',
    revenue: 'sum',
  })
 
  return stats
}
With this setup, your upstream database sees at most one request per minute, regardless of how many users visit the dashboard.

API responses in streaming contexts
Cache API responses that are fetched during streaming or after dynamic operations:

app/feed/page.tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import { cacheLife, cacheTag } from 'next/cache'
 
export default async function FeedPage() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <FeedItems />
      </Suspense>
    </div>
  )
}
 
async function FeedItems() {
  // Defer to request time
  await connection()
 
  const items = await getFeedItems()
 
  return items.map((item) => <FeedItem key={item.id} item={item} />)
}
 
async function getFeedItems() {
  'use cache: remote'
  cacheTag('feed-items')
  cacheLife({ expire: 120 }) // 2 minutes
 
  // This API call is cached, reducing requests to your external service
  const response = await fetch('https://api.example.com/feed')
  return response.json()
}
Computed data after dynamic checks
Cache expensive computations that occur after dynamic security or feature checks:

app/reports/page.tsx
import { connection } from 'next/server'
import { cacheLife } from 'next/cache'
 
export default async function ReportsPage() {
  // Defer to request time (for security check)
  await connection()
 
  const report = await generateReport()
 
  return <ReportViewer report={report} />
}
 
async function generateReport() {
  'use cache: remote'
  cacheLife({ expire: 3600 }) // 1 hour
 
  // This expensive computation is cached and shared across all authorized users,
  // avoiding repeated calculations
  const data = await db.transactions.findMany()
 
  return {
    totalRevenue: calculateRevenue(data),
    topProducts: analyzeProducts(data),
    trends: calculateTrends(data),
  }
}
Mixed caching strategies
Combine static, remote, and private caching for optimal performance:

app/product/[id]/page.tsx
import { Suspense } from 'react'
import { connection } from 'next/server'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'
 
// Static product data - prerendered at build time
async function getProduct(id: string) {
  'use cache'
  cacheTag(`product-${id}`)
 
  // This is cached at build time and shared across all users
  return db.products.find({ where: { id } })
}
 
// Shared pricing data - cached at runtime in remote handler
async function getProductPrice(id: string) {
  'use cache: remote'
  cacheTag(`product-price-${id}`)
  cacheLife({ expire: 300 }) // 5 minutes
 
  // This is cached at runtime and shared across all users
  return db.products.getPrice({ where: { id } })
}
 
// User-specific recommendations - private cache per user
async function getRecommendations(productId: string) {
  'use cache: private'
  cacheLife({ expire: 60 }) // 1 minute
 
  const sessionId = (await cookies()).get('session-id')?.value
 
  // This is cached per-user and never shared
  return db.recommendations.findMany({
    where: { productId, sessionId },
  })
}
 
export default async function ProductPage({ params }) {
  const { id } = await params
 
  // Static product data
  const product = await getProduct(id)
 
  return (
    <div>
      <ProductDetails product={product} />
 
      {/* Dynamic shared price */}
      <Suspense fallback={<PriceSkeleton />}>
        <ProductPriceComponent productId={id} />
      </Suspense>
 
      {/* Dynamic personalized recommendations */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <ProductRecommendations productId={id} />
      </Suspense>
    </div>
  )
}
 
function ProductDetails({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  )
}
 
async function ProductPriceComponent({ productId }) {
  // Defer to request time
  await connection()
 
  const price = await getProductPrice(productId)
  return <div>Price: ${price}</div>
}
 
async function ProductRecommendations({ productId }) {
  const recommendations = await getRecommendations(productId)
  return <RecommendationsList items={recommendations} />
}
 
function PriceSkeleton() {
  return <div>Loading price...</div>
}
 
function RecommendationsSkeleton() {
  return <div>Loading recommendations...</div>
}
 
function RecommendationsList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
Good to know:

Remote caches are stored in server-side cache handlers and shared across all users
'use cache: remote' works outside the static shell where use cache may not provide server-side cache hits
Use cacheTag() and revalidateTag() to invalidate remote caches on-demand
Use cacheLife() to configure cache expiration
For user-specific data, use 'use cache: private' instead of 'use cache: remote'
Remote caches reduce origin load by storing computed or fetched data server-side
Platform Support
Deployment Option	Supported
Node.js server	Yes
Docker container	Yes
Static export	No
Adapters	Yes
Version History
Version	Changes
v16.0.0	"use cache: remote" is enabled with the Cache Components feature.===================---
title: "use cache: private"
description: "Learn how to use the \"use cache: private\" directive to cache functions that access runtime request APIs."
url: "https://nextjs.org/docs/app/api-reference/directives/use-cache-private"
docs_index: /docs/llms.txt
version: 16.2.6
lastUpdated: 2026-05-19
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "Directives: /docs/app/api-reference/directives"
related:
  - app/api-reference/directives/use-cache
  - app/api-reference/config/next-config-js/cacheComponents
  - app/api-reference/functions/cacheLife
  - app/api-reference/functions/cacheTag
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

> This feature is currently experimental and subject to change, it's not recommended for production. Try it out and share your feedback on [GitHub](https://github.com/vercel/next.js/issues).

The `'use cache: private'` directive allows functions to access runtime request APIs like `cookies()`, `headers()`, and `searchParams` within a cached scope. However, results are **never stored on the server**, they're cached only in the browser's memory and do not persist across page reloads.

Reach for `'use cache: private'` when:

* You want to cache a function that already accesses runtime data, and refactoring to [move the runtime access outside and pass values as arguments](/docs/app/getting-started/caching#working-with-runtime-apis) is not practical.
* Compliance requirements prevent storing certain data on the server, even temporarily

Because this directive accesses runtime data, the function executes on every server render and is excluded from running during [static shell](/docs/app/getting-started/caching#how-rendering-works) generation.

It is **not** possible to configure custom cache handlers for `'use cache: private'`.

For a comparison of the different cache directives, see [How `use cache: remote` differs from `use cache` and `use cache: private`](/docs/app/api-reference/directives/use-cache-remote#how-use-cache-remote-differs-from-use-cache-and-use-cache-private).

> **Good to know**: This directive is marked as `experimental` because it depends on runtime prefetching, which is not yet stable. Runtime prefetching is an upcoming feature that will let the router prefetch past the [static shell](/docs/app/getting-started/caching#how-rendering-works) into **any** cached scope, not just private caches.

## Usage

To use `'use cache: private'`, enable the [`cacheComponents`](/docs/app/api-reference/config/next-config-js/cacheComponents) flag in your `next.config.ts` file:

```tsx filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

```jsx filename="next.config.js" switcher
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

Then add `'use cache: private'` to your function along with a `cacheLife` configuration.

> **Good to know**: This directive is not available in Route Handlers.

### Basic example

In this example, we demonstrate that you can access cookies within a `'use cache: private'` scope:

```tsx filename="app/product/[id]/page.tsx" switcher
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }]
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Recommendations productId={id} />
      </Suspense>
    </div>
  )
}

async function Recommendations({ productId }: { productId: string }) {
  const recommendations = await getRecommendations(productId)

  return (
    <div>
      {recommendations.map((rec) => (
        <ProductCard key={rec.id} product={rec} />
      ))}
    </div>
  )
}

async function getRecommendations(productId: string) {
  'use cache: private'
  cacheTag(`recommendations-${productId}`)
  cacheLife({ stale: 60 })

  // Access cookies within private cache functions
  const sessionId = (await cookies()).get('session-id')?.value || 'guest'

  return getPersonalizedRecommendations(productId, sessionId)
}
```

```jsx filename="app/product/[id]/page.js" switcher
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export async function generateStaticParams() {
  return [{ id: '1' }]
}

export default async function ProductPage({ params }) {
  const { id } = await params

  return (
    <div>
      <ProductDetails id={id} />
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <Recommendations productId={id} />
      </Suspense>
    </div>
  )
}

async function Recommendations({ productId }) {
  const recommendations = await getRecommendations(productId)

  return (
    <div>
      {recommendations.map((rec) => (
        <ProductCard key={rec.id} product={rec} />
      ))}
    </div>
  )
}

async function getRecommendations(productId) {
  'use cache: private'
  cacheTag(`recommendations-${productId}`)
  cacheLife({ stale: 60 })

  // Access cookies within private cache functions
  const sessionId = (await cookies()).get('session-id')?.value || 'guest'

  return getPersonalizedRecommendations(productId, sessionId)
}
```

> **Good to know**: The `stale` time must be at least 30 seconds for runtime prefetching to work. See [`cacheLife` client cache behavior](/docs/app/api-reference/functions/cacheLife#client-cache-behavior) for details.

## Request APIs allowed in private caches

The following request-specific APIs can be used inside `'use cache: private'` functions:

| API            | Allowed in `use cache` | Allowed in `'use cache: private'` |
| -------------- | ---------------------- | --------------------------------- |
| `cookies()`    | No                     | Yes                               |
| `headers()`    | No                     | Yes                               |
| `searchParams` | No                     | Yes                               |
| `connection()` | No                     | No                                |

> **Note:** The [`connection()`](https://nextjs.org/docs/app/api-reference/functions/connection) API is prohibited in both `use cache` and `'use cache: private'` as it provides connection-specific information that cannot be safely cached.

## Version History

| Version   | Changes                                                              |
| --------- | -------------------------------------------------------------------- |
| `v16.0.0` | `"use cache: private"` is enabled with the Cache Components feature. |
## Related

View related API references.

- [use cache](/docs/app/api-reference/directives/use-cache)
  - Learn how to use the "use cache" directive to cache data in your Next.js application.
- [cacheComponents](/docs/app/api-reference/config/next-config-js/cacheComponents)
  - Learn how to enable the cacheComponents flag in Next.js.
- [cacheLife](/docs/app/api-reference/functions/cacheLife)
  - Learn how to use the cacheLife function to set the cache expiration time for a cached function or component.
- [cacheTag](/docs/app/api-reference/functions/cacheTag)
  - Learn how to use the cacheTag function to manage cache invalidation in your Next.js application.

---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)



updateTag
Last updated May 19, 2026
updateTag allows you to update cached data on-demand for a specific cache tag from within Server Actions.

This function is designed for read-your-own-writes scenarios, where a user makes a change (like creating a post), and the UI immediately shows the change, rather than stale data.

Usage
updateTag can only be called from within Server Actions. It cannot be used in Route Handlers, Client Components, or any other context.

If you need to invalidate cache tags in Route Handlers or other contexts, use revalidateTag instead.

Good to know: updateTag immediately expires the cached data for the specified tag. The next request will wait to fetch fresh data rather than serving stale content from the cache, ensuring users see their changes immediately.

Parameters
updateTag(tag: string): void;
tag: A string representing the cache tag associated with the data you want to update. Must not exceed 256 characters. This value is case-sensitive.
Tags must first be assigned to cached data. You can do this in two ways:

Using the next.tags option with fetch for caching external API requests:
fetch(url, { next: { tags: ['posts'] } })
Using cacheTag inside cached functions or components with the 'use cache' directive:
import { cacheTag } from 'next/cache'
 
async function getData() {
  'use cache'
  cacheTag('posts')
  // ...
}
Returns
updateTag does not return a value.

Differences from revalidateTag
While both updateTag and revalidateTag invalidate cached data, they serve different purposes:

updateTag:

Can only be used in Server Actions
Next request waits for fresh data (no stale content served)
Designed for read-your-own-writes scenarios
revalidateTag:

Can be used in Server Actions and Route Handlers
With profile="max" (recommended): Serves cached data while fetching fresh data in the background (stale-while-revalidate)
With custom profile: Can be configured to any cache life profile for advanced usage
Without profile: legacy behavior which is equivalent to updateTag
Examples
Server Action with Read-Your-Own-Writes
app/actions.ts
TypeScript

TypeScript
'use server'
 
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
 
export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')
 
  // Create the post in your database
  const post = await db.post.create({
    data: { title, content },
  })
 
  // Invalidate cache tags so the new post is immediately visible
  // 'posts' tag: affects any page that displays a list of posts
  updateTag('posts')
  // 'post-{id}' tag: affects the individual post detail page
  updateTag(`post-${post.id}`)
 
  // Redirect to the new post - user will see fresh data, not cached
  redirect(`/posts/${post.id}`)
}
Error when used outside Server Actions
app/api/posts/route.ts
TypeScript

TypeScript
import { updateTag } from 'next/cache'
 
export async function POST() {
  // This will throw an error
  updateTag('posts')
  // Error: updateTag can only be called from within a Server Action
 
  // Use revalidateTag instead in Route Handlers
  revalidateTag('posts', 'max')
}
When to use updateTag
Use updateTag when:

You're in a Server Action
You need immediate cache invalidation for read-your-own-writes
You want to ensure the next request sees updated data
Use revalidateTag instead when:

You're in a Route Handler or other non-action context
You want stale-while-revalidate semantics
You're building a webhook or API endpoint for cache invalidation
Related
revalidateTag - For invalidating tags in Route Handlers
revalidatePath - For invalidating specific paths