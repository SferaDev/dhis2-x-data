import React from "react";
import { pages } from "..";
import { HomeCard } from "../../components/home-card/HomeCard";
import { Page } from "../../components/page/Page";

export const Home = () => {
    return (
        <Page>
            {pages.map(page => {
                if (page.type === "item") return null;

                return (
                    <React.Fragment key={`group-${page.label}`}>
                        <h2>{page.label}</h2>

                        {page.items.map(item => (
                            <HomeCard key={`card-${item.label}`} item={item} />
                        ))}
                    </React.Fragment>
                );
            })}
        </Page>
    );
};
