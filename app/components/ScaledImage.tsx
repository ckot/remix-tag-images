
/**
 * A simple wrapper around an image which computes the aspect ratio
 * from width & height and allows one to specify either desiredWidth or
 * desiredHeight do render it scaled, preserving aspect ratio
 *
 * Accepts a lazy boolean param which will get passed down to the image
 */
interface ScaledImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    desiredWidth?: number;
    desiredHeight?: number;
    lazy: boolean;
}

export default function ScaledImage(props: ScaledImageProps) {
    const {
      src,
      alt,
      width,
      height,
      desiredWidth = null,
      desiredHeight = null,
      lazy = false,
    } = props;


    const aspectRatio = width / height
    let renderedWidth
    let renderedHeight
    if (desiredWidth == null && desiredHeight == null) {
        // simply use the passed in width and height
        renderedWidth = width;
        renderedHeight = height;
    } else if (desiredWidth != null && desiredHeight == null) {
        // compute height given the desired width and aspect ratio
        renderedWidth = desiredWidth;
        renderedHeight = desiredWidth / aspectRatio
    } else if (desiredWidth == null && desiredHeight != null) {
        // compute width given the desired height and aspect ratio
        renderedHeight = desiredHeight;
        renderedWidth = desiredHeight * aspectRatio
    }

    return (
      <img
        src={src}
        alt={alt}
        width={renderedWidth}
        height={renderedHeight}
        loading={lazy ? "lazy" : "eager"}
      />
    )

}

