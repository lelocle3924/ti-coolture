import { useEffect, useState } from "react";
import { fetchBlogPosts, type BlogPost } from "../lib/dbService";
import { ArcTopRight } from "../components/BrandShapes";

/**
 * Tạp chí — the editorial index. Backed by blog_posts / blog_topics in the mock
 * store, which mirror the tables in docs/SRS.md §4 (BL-*). Individual post
 * pages are not built yet: there is no body content to render.
 */
export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts()
      .then(setPosts)
      .catch((err) => console.error("Error loading blog posts:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative overflow-hidden bg-brand text-paper">
      <ArcTopRight
        className="pointer-events-none absolute -right-20 -top-20 z-0 opacity-20"
        style={{ width: "clamp(9rem, 24vw, 22rem)" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
        <h1 className="display m-0 text-[2rem] md:text-[3rem] leading-tight normal-case">Tạp chí</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/88">
          Chuyện nghề, chuyện người làm ra sản phẩm, và những nơi đáng đi một buổi chiều.
        </p>

        {loading ? (
          <div className="mt-12 grid gap-8 md:grid-cols-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/2] rounded-lg bg-white/10" />
                <div className="mt-4 h-5 w-4/5 bg-white/10" />
                <div className="mt-2 h-3 w-2/5 bg-white/10" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-sm text-white/80">
            Chưa có bài nào. Tí đang viết những bài đầu tiên.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-7">
            {posts.map((post, idx) => (
              <article key={post.id} className={idx === 0 ? "md:col-span-3" : ""}>
                <div
                  className={`overflow-hidden rounded-lg bg-paper-warm ${
                    idx === 0 ? "aspect-[21/9]" : "aspect-[3/2]"
                  }`}
                >
                  <img
                    src={post.coverUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-4 m-0 label text-wave">
                  {post.topic} · {post.readMinutes} phút đọc
                </p>
                <h2
                  className={`mt-2 m-0 font-medium leading-snug ${
                    idx === 0 ? "text-2xl md:text-[2rem] max-w-3xl" : "text-lg"
                  }`}
                >
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 m-0 max-w-2xl text-sm leading-relaxed text-white/80">
                    {post.excerpt}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <p className="mt-14 m-0 text-xs text-white/55">
          Nội dung mẫu — bài viết đầy đủ sẽ có khi phần biên tập hoàn thiện.
        </p>
      </div>
    </div>
  );
}
