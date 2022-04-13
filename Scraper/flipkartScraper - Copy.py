import re
import time
import pandas as pd
import os
from csv import DictWriter
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException, ElementNotInteractableException

PATH=os.getcwd()+"\\chromedriver.exe"
driver = webdriver.Chrome(PATH)
# driver = webdriver.Chrome(service=Service(PATH))
driver.get("http://flipkart.com")
driver.implicitly_wait(5)
field_names = ['Category','Sub-Category','Generic Name','Product Name','Product Brand','Product Offer Price','Product Maximum Retail Price', 'Product Image URL', 'Product Rating', 'Product COO Tag', 'Product Seller','quantity', 'sellerUsername']

# Closing login popup
try:
    driver.find_element(By.XPATH,"//button[@class='_2KpZ6l _2doB4z']").click()
except NoSuchElementException:
    pass

driver.implicitly_wait(5)
actions=ActionChains(driver)
categories=[4,6,9]                      # fashion/home/beauty and more
subcategoriesCount=[11,11,11]
with open('products.csv', 'a', encoding="utf-8",newline='') as f_object:
    headers={'Category': 'CATEGORY','Sub-Category': 'SUB-CATEGORY','Generic Name': 'GENERIC NAME','Product Name': 'PRODUCT NAME','Product Brand': 'PRODUCT BRAND','Product Offer Price': 'PRODUCT OFFER PRICE','Product Maximum Retail Price': 'PRODUCT MAXIMUM RETAIL PRICE', 'Product Image URL': 'PRODUCT IMAGE URL', 'Product Rating': 'PRODUCT RATING', 'Product COO Tag': 'PRODUCT COO TAG', 'Product Seller': 'PRODUCT SELLER', 'quantity':'QUANTITY', 'sellerUsername':"SELLER USERNAME"}
    dictwriter_object = DictWriter(f_object, fieldnames=field_names)
    dictwriter_object.writerow(headers)
    current_category=""
    current_sub_category=""
    for i in range(5):
        try: 
            categoryelement = driver.find_element(By.XPATH,'//*[@id="container"]/div/div[2]/div/div/div[{category}]/a/div[2]/div/div'.format(category=categories[i]))
            current_category=categoryelement.text
            print("Scraping start for",current_category)
            actions.move_to_element(categoryelement).perform()
        except NoSuchElementException:
            print("category not found!")
            continue
        driver.implicitly_wait(5)
        for j in range(subcategoriesCount[i]):
            try:
                subcategoryelement = driver.find_element(By.XPATH,'//*[@id="container"]/div/div[2]/div/div/div[{category}]/a/div[2]/div[2]/div[2]/div/div/div[1]/a[{subcategory}]'.format(category=categories[i],subcategory=j+1))
                current_sub_category=subcategoryelement.text
                print("Scraping start for",current_sub_category)
                if current_category=='Beauty, Toys & More' and current_sub_category=='Books & Music':
                    continue
                if current_category=='Beauty, Toys & More':
                    try: 
                        viewallbutton = driver.find_element(By.XPATH,'//*[@class="_6WOcW9 _3YpNQe" and contains(text(),"View All")]')
                        actions.click(viewallbutton).perform()
                    except NoSuchElementException:
                        print("view all button not found!")
                        continue
                else:
                    actions.click(subcategoryelement).perform()
            except NoSuchElementException:
                print("subcategory not found")
                continue
            

            page=1
            while True:
                rows=10
                columns=4
                print("Scraping start for page",page)
                for row in range(2,4):
                    for col in range(1,3):
                        try:
                            driver.implicitly_wait(2)
                            # productelement=driver.find_element(By.XPATH,'//*[@id="container"]/div/div[3]/div/div[2]/div[{r}]/div/div[{c}]/div/a'.format(r=row,c=col))
                            driver.find_element(By.XPATH,'//*[@id="container"]/div/div[3]/div/div[2]/div[{r}]/div/div[{c}]/div/a'.format(r=row,c=col)).click()
                            # actions.click(productelement).perform()
                        except Exception as e:
                            print(e)
                            continue

                        driver.implicitly_wait(1)
                        handles=driver.window_handles
                        driver.switch_to.window(handles[-1])
                        print(driver.title)
                        driver.refresh()

                        try:
                            driver.implicitly_wait(2)
                            # plusbutton = driver.find_element(By.XPATH,"//img[@src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCI+PHBhdGggZmlsbD0iIzg3ODc4NyIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTQgOEg4djZINlY4SDBWNmg2VjBoMnY2aDZ6Ii8+PC9zdmc+']")
                            driver.find_element(By.XPATH,"//img[@src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCI+PHBhdGggZmlsbD0iIzg3ODc4NyIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTQgOEg4djZINlY4SDBWNmg2VjBoMnY2aDZ6Ii8+PC9zdmc+']").click()
                            # actions.click(plusbutton).perform()
                        except NoSuchElementException:
                            driver.refresh()
                            print("plus button not found")
                        except ElementNotInteractableException:
                            print("ElementNotInteractableException occurred!")

                        driver.implicitly_wait(2)

                        try:
                            # readmorebutton = driver.find_element(By.XPATH,'//button[@class="_2KpZ6l _1FH0tX" or @class="_2KpZ6l _1zH-yM"]')
                            # actions.click(readmorebutton).perform()
                            driver.find_element(By.XPATH,'//button[@class="_2KpZ6l _1FH0tX" or @class="_2KpZ6l _1zH-yM"]').click()
                        except NoSuchElementException:
                            print("read more button not found")
                        except ElementNotInteractableException:
                            print("ElementNotInteractableException occurred!")

                        try:
                            # cootaginfowindow = driver.find_element(By.XPATH,'//div[contains(text(),"Manufacturing, Packaging and Import Info")]')
                            # actions.click(cootaginfowindow).perform()
                            driver.find_element(By.XPATH,'//div[contains(text(),"Manufacturing, Packaging and Import Info")]').click()
                        except NoSuchElementException:
                            print("manufacturing details not found")
                        except ElementNotInteractableException:
                            print("ElementNotInteractableException occurred!")

                        countryoforigin=""
                        try:
                            countryoforigin = driver.find_element(By.XPATH,'//div[contains(text(),"Country of Origin")]/following-sibling::div').get_attribute('textContent')
                        except NoSuchElementException:
                            try:
                                countryoforigin = driver.find_element(By.XPATH,'//div[contains(text(),"Country of Origin")]/following-sibling::span').get_attribute('textContent')
                            except NoSuchElementException:
                                print("country of origin tag not found")

                        if re.search("India",countryoforigin):
                            genericname=""
                            try:
                                genericname = driver.find_element(By.XPATH,'//div[contains(text(),"Generic Name")]/following-sibling::div').get_attribute('textContent')
                            except NoSuchElementException:
                                try:
                                    genericname = driver.find_element(By.XPATH,'//div[contains(text(),"Generic Name")]/following-sibling::span').get_attribute('textContent')
                                except NoSuchElementException:
                                    print("generic name not found")

                            try:
                                # closebutton=driver.find_element(By.XPATH,'//*[@id="container"]/div/div[1]/div/button')
                                # actions.click(closebutton).perform()
                                driver.find_element(By.XPATH,'//*[@id="container"]/div/div[1]/div/button').click()
                            except NoSuchElementException:
                                print("close button not found")
                            except ElementNotInteractableException:
                                print("ElementNotInteractableException occurred!")

                            productname=""
                            try:
                                productname=driver.find_element(By.CLASS_NAME,'B_NuCI').get_attribute('textContent')
                            except NoSuchElementException:
                                print("product name not found")

                            productprice=""
                            try:
                                productprice=driver.find_element(By.XPATH,"//div[@class='_30jeq3 _16Jk6d']").get_attribute('textContent')
                            except NoSuchElementException:
                                print("price not found")

                            productmrp=""
                            try:
                                productmrp=driver.find_element(By.XPATH,"//div[@class='_3I9_wc _2p6lqe']").get_attribute('textContent')
                            except NoSuchElementException:
                                print("mrp not found")

                            productseller=""
                            try:
                                productseller=driver.find_element(By.XPATH,"//div[@id='sellerName']/child::span/child::span").get_attribute('textContent')
                            except NoSuchElementException:
                                print("seller not found")

                            productrating=""
                            try:
                                productrating=driver.find_element(By.XPATH,"//*[starts-with(@id,'productRating')]/child::div").get_attribute('textContent')
                            except NoSuchElementException:
                                print("product rating not found")

                            productbrand=""
                            try:
                                productbrand=driver.find_element(By.XPATH,"//*[@class='G6XhRU']").get_attribute('textContent')
                            except NoSuchElementException:
                                print("product brand not found")

                            driver.implicitly_wait(1)

                            productimageurl=""
                            try:
                                productimageurl=driver.find_element(By.XPATH,"//div[@class='_3kidJX']/child::div[2]/child::div/child::img").get_attribute('src')
                            except NoSuchElementException:
                                try:
                                    productimageurl=driver.find_element(By.XPATH,"//div[@class='_3kidJX']/child::div[2]/child::img").get_attribute('src')
                                except NoSuchElementException:
                                    print("product image not found")
                                
                            product={'Category':current_category,'Sub-Category':current_sub_category,'Generic Name':genericname,'Product Name':productname,'Product Brand':productbrand[:-1],'Product Offer Price':productprice[1:],'Product Maximum Retail Price':productmrp[1:],'Product Image URL':productimageurl,'Product Rating':productrating,'Product COO Tag':countryoforigin, 'Product Seller':productseller, 'quantity':50, 'sellerUsername':"retailnet@gmail.com"}
                            dictwriter_object = DictWriter(f_object, fieldnames=field_names)
                            dictwriter_object.writerow(product)
                        else:
                            pass

                        if len(driver.window_handles)>1:
                            driver.close()
                            handles=driver.window_handles
                            driver.switch_to.window(handles[0])
                        else:
                            pass
                print("Scraping end for page",page)
                try:
                    driver.implicitly_wait(5)
                    # nextbutton = driver.find_element(By.XPATH,"//a[@class='_1LKTO3']/child::span[contains(text(),'Next')]")
                    page+=1
                    # actions.click(nextbutton).perform()
                    driver.find_element(By.XPATH,"//a[@class='_1LKTO3']/child::span[contains(text(),'Next')]").click()
                except NoSuchElementException:
                    print("Scraping end for", current_sub_category)
                    break
                except ElementNotInteractableException:
                    print("ElementNotInteractableException occurred!")
                    break
            if page>1:
                break
            driver.back()
            driver.implicitly_wait(5)
            categoryelement = driver.find_element(By.XPATH,'//*[@id="container"]/div/div[2]/div/div/div[{category}]/a/div[2]/div/div'.format(category=categories[i]))
            actions.move_to_element(categoryelement).perform()
        print("Scraping end for",current_category)
    f_object.close()
driver.quit()   
print("Scraping ends successfully!")   