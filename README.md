
    jq -r '.from.email' * | sort | uniq -c | sort -nr

    jq -r '[.from.email, input_filename] | join(",")' *

    jq -r 'select(.from.email == "no.address@enron.com") | [.from.email, input_filename] | join(",")' *
    
    jq -r 'select(.from.email | contains("@match.com")) | [.from.email, input_filename] | join(",")' *

    jq -r 'select(.from.email | contains("@match.com")) | input_filename' *


    find . -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("@match.com")) | input_filename' {} + | xargs -n1 -I'{}' mv '{}' ~/Organized/bulk/match.com/.

    find . -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("@sportsline.com")) | input_filename' {} + | xargs -n1 -I'{}' mv '{}' ~/Organized/bulk/sportsline.com/.

    find . -maxdepth 1 -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("no.address@enron.com")) | input_filename' {} + | xargs -n1 -I'{}' mv '{}' ~/Organized/bulk/no.address/.


    find . -maxdepth 1 -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("@cnn.com")) | input_filename' {} + | xargs -n1 -I'{}' mv '{}' ~/Organized/bulk/cnn.com/.


    find . -maxdepth 1 -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("@scientech.com")) | input_filename' {} + | xargs -n1 -I'{}' mv '{}' ~/Organized/bulk/scientech.com/.


    # Group and count all emails that are not from @enron.com
    find . -maxdepth 1 -type f \! -name ".*" -exec jq -r 'select(.from.email | contains("@enron.com") | not) | .from.email' {} \+ | sort | uniq -c | sort -n
    
