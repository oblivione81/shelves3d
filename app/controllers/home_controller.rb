
require 'oauth'


class HomeController < ApplicationController
  def index
    @access_token = session[:access_token]
    @test = session["test"]
    @testa = "testa"
  end

  def auth_request
    @consumer = OAuth::Consumer.new('L1biaqDh5wN8USqxqqyrA',
                                   'R6KXCYMIAaeZP6oacuKOESAks0fWzSvgK2qF6CQq4o',
                                   :site=>'http://www.goodreads.com')
    @request_token = @consumer.get_request_token
    session[:request_token] = @request_token
    redirect_to @request_token.authorize_url
  end

  def authorized
    session[:access_token] = session[:request_token].get_access_token
    session["test"] = "questo is a test"
    redirect_to "/home/index"
  end
end
