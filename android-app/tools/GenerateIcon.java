import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;

/**
 * 生成应用启动图标 PNG（多密度），无需第三方库，使用 JDK 自带 ImageIO。
 * 用法: javac GenerateIcon.java && java -cp . GenerateIcon <res目录>
 */
public class GenerateIcon {
    public static void main(String[] args) throws Exception {
        int[] sizes = {48, 72, 96, 144, 192};
        String[] names = {"mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"};
        String base = args.length > 0 ? args[0] : "res";
        for (int i = 0; i < sizes.length; i++) {
            int s = sizes[i];
            BufferedImage img = new BufferedImage(s, s, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            GradientPaint gp = new GradientPaint(0, 0, new Color(0x1a, 0x9a, 0x6e),
                    s, s, new Color(0x15, 0x87, 0x5d));
            g.setPaint(gp);
            int pad = Math.max(1, s / 12);
            g.fillRoundRect(pad, pad, s - 2 * pad, s - 2 * pad, s / 5, s / 5);

            g.setColor(Color.WHITE);
            Font f = new Font("SansSerif", Font.BOLD, (int) (s * 0.62));
            g.setFont(f);
            FontMetrics fm = g.getFontMetrics();
            String t = "A";
            int tw = fm.stringWidth(t);
            int th = fm.getAscent();
            g.drawString(t, (s - tw) / 2, (s + th) / 2 - fm.getDescent() / 2);
            g.dispose();

            File dir = new File(base + "/mipmap-" + names[i]);
            dir.mkdirs();
            ImageIO.write(img, "png", new File(dir, "ic_launcher.png"));
            System.out.println("wrote mipmap-" + names[i] + " (" + s + "px)");
        }
    }
}
