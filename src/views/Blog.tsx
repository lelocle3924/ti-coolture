import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { fetchBlogPosts, BlogPost } from "../lib/dbService";
import { ArcTopRight, WaveBlog } from "../components/BrandShapes";
import { vtBlogCover, withDirectionalTransition } from "../lib/viewTransitions";

const TOPICS = [
  "Tất cả",
  "Chuyện nghề & Nghệ nhân",
  "Không gian & Điểm đến",
  "Văn hoá bản địa",
  "Phong cách sống"
];

export default function Blog() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<string>("Tất cả");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchBlogPosts();
      setBlogs(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleTopicSelect = (topic: string) => {
    const currentIdx = TOPICS.indexOf(activeTopic);
    const nextIdx = TOPICS.indexOf(topic);
    const dir = nextIdx >= currentIdx ? "forward" : "backward";

    withDirectionalTransition(dir, () => {
      setActiveTopic(topic);
    });
  };

  const filteredBlogs = blogs.filter(b => {
    if (activeTopic === "Tất cả") return true;
    return b.topic === activeTopic;
  });

  const featuredPost = filteredBlogs[0] || blogs[0];
  const secondaryPosts = filteredBlogs.slice(1);

  return (
    <div className="min-h-[100dvh] bg-paper-warm text-ink pb-28 select-none relative">
      
      {/* Scroll Reading Progress Bar (§D1 Wireframe Spec) */}
      <div className="scroll-prog" />

      {/* ============ EDITORIAL MAGAZINE HERO BANNER ============ */}
      <section className="bg-brand text-paper pt-10 md:pt-14 pb-12 md:pb-16 px-4 md:px-8 relative overflow-hidden">
        <ArcTopRight
          className="pointer-events-none absolute -right-16 -top-16 z-0 opacity-15"
          style={{ width: "clamp(18rem, 38vw, 30rem)" }}
          fill="var(--color-wave)"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1 text-[11px] font-semibold text-wave backdrop-blur-md border border-white/15">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">TẠP CHÍ CHUYỆN NGHỀ & VĂN HOÁ BẢN ĐỊA</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="display text-3xl md:text-5xl normal-case font-medium leading-tight text-paper">
                Chuyện Nghề & Điểm Đến
              </h1>
              <p className="text-xs md:text-sm text-white/85 max-w-xl leading-relaxed">
                Những bài viết chuyên sâu về nghề thủ công truyền thống, hành trình sáng tạo của các nghệ nhân đương đại và những không gian văn hoá đáng ghé thăm.
              </p>
            </div>

            <div className="text-xs text-white/75 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shrink-0">
              <strong className="text-wave font-bold text-base">{blogs.length}</strong> bài viết chọn lọc
            </div>
          </div>
        </div>

        {/* Negative transition seam */}
        <WaveBlog
          className="absolute bottom-0 left-0 right-0 w-full z-10 pointer-events-none"
          fill="var(--color-paper-warm)"
        />
      </section>

      {/* ============ MAIN CONTENT AREA ============ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-2 space-y-6">
        
        {/* Breadcrumbs */}
        <nav className="text-[11px] text-ink/60 flex items-center gap-1.5 font-medium">
          <Link to="/" viewTransition className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-ink font-semibold">Tạp chí Tí</span>
        </nav>

        {/* DOUBLE-BEZEL TOPIC TAXONOMY FILTER STRIP */}
        <div className="p-1.5 rounded-[2rem] bg-black/5 ring-1 ring-black/5">
          <div className="rounded-[1.625rem] bg-paper p-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {TOPICS.map((topic) => {
              const isActive = activeTopic === topic;
              return (
                <button
                  key={topic}
                  onClick={() => handleTopicSelect(topic)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-brand text-paper shadow-md shadow-brand/20 scale-[1.02]"
                      : "text-ink/75 hover:text-ink hover:bg-black/5"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-84 rounded-[2.5rem] bg-paper animate-pulse border border-ink/10" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 rounded-[2rem] bg-paper animate-pulse border border-ink/10" />
              ))}
            </div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-2 rounded-[2.5rem] bg-black/5 max-w-md mx-auto my-12">
            <div className="bg-paper rounded-[2.125rem] p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-brand mx-auto" />
              <p className="text-sm font-semibold text-ink">Chưa có bài viết nào trong chủ đề này</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ============ DOUBLE-BEZEL LEAD STORY BILLBOARD ============ */}
            {featuredPost && (
              <div className="rev p-2 rounded-[2.5rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/30 transition-all duration-500 shadow-lg">
                <article className="group bg-paper rounded-[2.125rem] border border-ink/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto overflow-hidden bg-paper-warm relative min-h-[280px]">
                    <img
                      src={featuredPost.coverUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000"}
                      alt={featuredPost.title}
                      referrerPolicy="no-referrer"
                      style={{ viewTransitionName: vtBlogCover(featuredPost.id) }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    />
                    <div className="absolute top-4 left-4 bg-brand text-paper text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                      {featuredPost.topic}
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 md:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-ink/60 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand" />
                          <span>{featuredPost.readMinutes || 5} phút đọc</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-ink/40" />
                          <span>{featuredPost.publishedAt ? new Date(featuredPost.publishedAt).toLocaleDateString("vi-VN") : "Mới đăng"}</span>
                        </span>
                      </div>

                      <h2 className="display text-2xl md:text-3xl font-medium text-ink group-hover:text-brand transition-colors normal-case leading-snug">
                        {featuredPost.title}
                      </h2>

                      <p className="text-xs md:text-sm text-ink/75 leading-relaxed line-clamp-3">
                        {featuredPost.excerpt || "Khám phá câu chuyện đằng sau những sản phẩm độc bản tại Tí Coolture."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-ink/5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">Ban biên tập Tí</span>
                      
                      <div className="group/btn inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-brand text-paper text-xs font-semibold hover:bg-brand-deep transition-all shadow-sm cursor-pointer">
                        <span>Đọc câu chuyện</span>
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                          <ArrowRight className="w-3.5 h-3.5 text-paper" />
                        </div>
                      </div>
                    </div>
                  </div>

                </article>
              </div>
            )}

            {/* ============ DOUBLE-BEZEL SECONDARY STORIES GRID ============ */}
            {secondaryPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondaryPosts.map((post) => (
                  <div key={post.id} className="rev hover-elastic p-1.5 rounded-[2.25rem] bg-black/5 ring-1 ring-black/5 hover:ring-brand/40 cursor-pointer">
                    <article className="group bg-paper rounded-[1.875rem] border border-ink/5 flex flex-col justify-between overflow-hidden h-full">
                      <div>
                        <div className="aspect-[16/10] overflow-hidden bg-paper-warm relative">
                          <img
                            src={post.coverUrl || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600"}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            style={{ viewTransitionName: vtBlogCover(post.id) }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-paper/90 backdrop-blur-sm text-ink text-[10px] font-semibold px-3 py-1 rounded-full border border-ink/5 shadow-xs">
                            {post.topic}
                          </div>
                        </div>

                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-2 text-[11px] text-ink/60 font-medium">
                            <Clock className="w-3 h-3 text-brand" />
                            <span>{post.readMinutes || 4} phút đọc</span>
                            <span>•</span>
                            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN") : "Mới"}</span>
                          </div>

                          <h3 className="font-medium text-base text-ink group-hover:text-brand transition-colors normal-case line-clamp-2 leading-snug">
                            {post.title}
                          </h3>

                          <p className="text-xs text-ink/75 line-clamp-2 leading-relaxed">
                            {post.excerpt || "Khám phá câu chuyện đằng sau những sản phẩm độc bản tại Tí Coolture."}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-ink/5 mt-4 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink/70">Ban biên tập Tí</span>
                        <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer">
                          <span>Đọc tiếp</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                    </article>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
