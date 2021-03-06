import React, {useEffect, useState} from "react";
import { Login } from './loginDialog/main'
import { Register } from './registerDialog/main'
import {Heading, LoginButton, RegisterButton, SubHeading} from './styled'
import {IndividualArticlesCharts} from "../mainpage/individualArticles/charts/main";
import {
    ArticleHeading,
    ArticleSelect,
    DateButton,
    DateSelect, ErrorHeading, ErrorSubHeading,
    Result,
    UserTable
} from "../mainpage/individualArticles/styled";
import Select from "@atlaskit/select/Select";
import {ModalTransition} from "@atlaskit/modal-dialog";
import Modal from "@atlaskit/modal-dialog/dist/cjs/components/ModalWrapper";

export const LandingPage = () => {
    const [allArticles, setAllArticles] = useState([]);
    const [currentArticle, setCurrentArticle] = useState([]);
    const [currentArticleTitle, setCurrentArticleTitle] = useState("");
    const [currentRevisions, setCurrentRevisions] = useState([]);
    const [topFiveUsers, setTopFiveUsers] = useState([]);
    const [validatedFromYear, setValidatedFromYear] = useState("1800");
    const [validatedToYear, setValidatedToYear] = useState("2020");
    const [isOpen, setIsOpen] = useState(false);
    const [yearOptions, setYearOptions] = useState([]);

    useEffect(() => {
        fetch('/api/individual/getAllArticles').then(res => res.json()).then(list => setAllArticles(list));
        // GET request
        if (currentArticleTitle != "") {
            fetch('/api/individual/getTopFiveUsers/' + currentArticleTitle + '/' + validatedFromYear + '/' + validatedToYear).then(res => res.json()).then(list => setTopFiveUsers(list));
        }
    }, [currentArticleTitle, validatedFromYear, validatedToYear])

    const allArticlesOptions = allArticles.map(article => ({
        label: "Title: " + article._id.title + " " + "Number of Revisions: " + article.count,
        value: article
    }))

    const articleSelected = (value) => {
        setCurrentArticleTitle(value._id.title);
        setCurrentArticle(value);
    }

    var optionsLanding = [allArticlesOptions[0], allArticlesOptions[1], allArticlesOptions[2]];
    return (
        <div>

            <title>Wikipedia Analytics</title>
            <div>
                <Heading>Wikipedia Analytics</Heading>

                <SubHeading>This is a data analytic web application. Please register or login to start exploring!<br/><br/>
                    Features include computing various analytics at overall data set levels, as well as at individual article levels.<br/><br/>
                    Analytical charts are available for display as shown below. A history of author revisions and more details are also available.</SubHeading>
                <br/><br/><br/><br/>

                <div>
                    <SubHeading>Example Analytics</SubHeading>
                    <ArticleSelect>
                        <Select
                            onChange={e => articleSelected(e.value)}
                            options={optionsLanding}
                            placeholder="Select an article...">
                        </Select>

                    </ArticleSelect>


                    {currentArticle != ""
                        ? <div>
                            <IndividualArticlesCharts currentArticleTitle={currentArticleTitle} fromYear={validatedFromYear} toYear={validatedToYear} topFiveUsers={topFiveUsers}></IndividualArticlesCharts>
                        </div>

                        : <div></div>}

                    <ModalTransition>
                        {isOpen && (
                            <Modal onClose={() => setIsOpen(false)}>
                                <ErrorHeading>Error</ErrorHeading>
                                <ErrorSubHeading>Invalid year range entered! Please try again. </ErrorSubHeading>
                                <br></br>
                            </Modal>
                        )}
                    </ModalTransition>

                </div>
            </div>
            <LoginButton><Login/></LoginButton>
            <RegisterButton><Register/></RegisterButton>

        </div>
    )
}