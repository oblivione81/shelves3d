
KEY = 'L1biaqDh5wN8USqxqqyrA'
SECRET = 'R6KXCYMIAaeZP6oacuKOESAks0fWzSvgK2qF6CQq4o'
WEBSITE = 'http://www.goodreads.com'

OAUTH_CALLBACK = Rails.env.production? ? "http://shelves3d.herokuapp.com/home/authorized" :
                                          "http://localhost:3000/home/authorized"