require 'oauth'
require 'constants'

def prepare_access_token(oauth_token, oauth_token_secret)
  consumer = OAuth::Consumer.new(KEY, SECRET, { :site => WEBSITE})

  # now create the access token object from passed values
  token_hash = { :oauth_token => oauth_token,
                 :oauth_token_secret => oauth_token_secret
  }
  OAuth::AccessToken.from_hash(consumer, token_hash )
end