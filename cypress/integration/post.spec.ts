describe("navigation", () => {
    before(() => {
        cy.login();
    });
    it("writes a post, checks its there and deletes it", () => {
        cy.location("pathname", {timeout: 15000})
            .should("eq", "/home");

        cy.get("[data-cy='composePostDiv']")
            .type("this is a test post");
        cy.get("[data-cy='sendBtn']")
            .click();

        cy.get("[data-cy='postsList'] div div div div").eq(0).as("post")
            .should("contain.text", "this is a test post");

        cy.get("@post").find("[data-cy='postOptionsBtn']").click();
        cy.get("@post").find("[data-cy='deletePostBtn']").click();

        cy.get("@post")
            .should("not.contain.text", "this is a test post");
    });
});
