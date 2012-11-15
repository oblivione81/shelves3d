
require 'oauth'


class HomeController < ApplicationController
  def index
    puts session[:user_id]

    consumer = OAuth::Consumer.new('L1biaqDh5wN8USqxqqyrA',
                                   'R6KXCYMIAaeZP6oacuKOESAks0fWzSvgK2qF6CQq4o',
                                   :site=>'http://www.goodreads.com')
    access_token = OAuth::AccessToken.new(consumer, session[:access_token], session[:access_token_secret])


    response = access_token.get("/owned_books/user?format=xml&id=#{session[:user_id]}")
    xml_response = Nokogiri.XML(response.body)
    #a_book = xml_response.xpath("//owned_book")[0]
    #@books_list = a_book
  end

  def auth_request
    consumer = OAuth::Consumer.new('L1biaqDh5wN8USqxqqyrA',
                                   'R6KXCYMIAaeZP6oacuKOESAks0fWzSvgK2qF6CQq4o',
                                   :site=>'http://www.goodreads.com')
    session[:request_token] = consumer.get_request_token
    #session[:request_token] = request_token.token
    redirect_to session[:request_token].authorize_url
  end

  def authorized

    access_token = session[:request_token].get_access_token
    session[:access_token] = access_token.token
    session[:access_token_secret] = access_token.secret

    response = access_token.get('/api/auth_user')
    xml_response = Nokogiri.XML(response.body)
    session[:user_id] = xml_response.xpath("//@id").to_s
    redirect_to "/home/index"
  end
end
