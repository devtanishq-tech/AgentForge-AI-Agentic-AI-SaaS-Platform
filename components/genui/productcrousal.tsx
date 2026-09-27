import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  extracted_price: number;
  source: string;
  rating: number;
  reviews: number;
  thumbnail: string;
  product_Link?: string;
  source_image_Link: string;
}

export interface ProductCarouselProps {
  query: string;
  products: Product[];
  error?: string;
}

export function ProductCarousel({
  query,
  products,
  error,
}: ProductCarouselProps) {
  if (error) {
    return (
      <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
        {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-muted text-muted-foreground text-sm border">
        No products found for "{query}".
      </div>
    );
  }

  const renderStars = (rating: number, reviews: number) => {
    return (
      <div className="flex items-center gap-0.5">
        <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-medium ml-1">{rating.toFixed(1)}</span>
        {reviews > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({reviews.toLocaleString()})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="my-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-medium text-foreground">
          Top shopping results for{" "}
          <span className="font-semibold text-primary">"{query}"</span>
        </h3>
        <Badge
          variant="secondary"
          className="text-[10px] uppercase tracking-wider font-semibold"
        >
          Sponsored
        </Badge>
      </div>

      <div className="flex  overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-1 px-1 gap-x-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="shrink-0 w-55 sm:w-60 snap-start flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group cursor-pointer bg-card p-0"
          >
            <a href={product.product_Link} target="_blank">
              <div className="relative h-45 w-full bg-white flex items-center justify-center p-6 border-b border-border/50 overflow-hidden">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </a>

            <CardContent className="p-4 flex flex-col flex-1 gap-1.5">
              <h4
                className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors"
                title={product.title}
              >
                {product.title}
              </h4>

              {product.rating > 0 && (
                <div className="mt-0.5">
                  {renderStars(product.rating, product.reviews)}
                </div>
              )}

              <div className="mt-auto pt-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-xl tracking-tight text-foreground">
                    {product.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  {product.source_image_Link && (
                    <img
                      src={product.source_image_Link}
                      alt={product.description}
                      className="size-3.5 rounded-sm shrink-0"
                    />
                  )}
                  <span className="text-xs text-muted-foreground font-medium truncate">
                    {product.description}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
