
import com.googlecode.freemazon.BookDownloader;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 *
 * @author DL
 */
public class FreemazonMain {
    private static Set<String> readStrings(File file) throws IOException {
        final Set<String> strings = new HashSet<String>();
        
        final BufferedReader br = new BufferedReader(new FileReader(file));
        try {
            String line;
            while ((line = br.readLine()) != null) {
                if (!line.isEmpty()) {
                    strings.add(line);
                }
            }
        } finally {
            br.close();
        }
        
        return strings;
    }
    
    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            System.out.println("Usage: FreemazonMain <asin>");
            return;
        }

        final String asin = args[0];
        System.out.println("== asin: " + asin + " ==");

        BookDownloader downloader = new BookDownloader(null, asin);
        downloader.printInfo();

        Set<String> nextQueries = readStrings(WORD_LIST_FILE);
        while (!nextQueries.isEmpty()) {
            System.out.print("trying " + nextQueries.size() + " queries");
            Set<String> moreQueries = new HashSet<String>();
            for (String query : nextQueries) {
                moreQueries.addAll(downloader.useQuery(query));
                System.out.print(".");
            }
            System.out.println("");

            nextQueries = moreQueries;
            downloader.printInfo();
        }

        for (String authCookie : readStrings(COOKIES_FILE)) {
            System.out.println("== next user: " + authCookie + " ==");
            downloader = new BookDownloader(authCookie, asin);

            downloader.retrieveImageUrls();
            downloader.printInfo();
        }

        downloader = new BookDownloader(null, asin);
        downloader.saveImages();
        downloader.printInfo();
    }
    
    private static final File WORD_LIST_FILE = new File("wordlist.txt");
    private static final File COOKIES_FILE = new File("cookies.txt");
}
